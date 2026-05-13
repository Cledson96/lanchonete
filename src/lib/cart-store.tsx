"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import type { CartItem } from "@/lib/contracts/cart";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
};

type CartAction =
  | { type: "ADD_ITEM"; item: Omit<CartItem, "id"> }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
  | { type: "UPDATE_NOTES"; id: string; notes?: string | null }
  | { type: "CLEAR_CART" }
  | { type: "SET_OPEN"; open: boolean }
  | { type: "HYDRATE"; items: CartItem[] };

function normalizeNotes(notes?: string | null) {
  const trimmed = notes?.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptions(options?: string[]): string {
  if (!options || options.length === 0) return "";
  return [...options].sort().join(",");
}

function cartLineKey(item: Omit<CartItem, "id">): string {
  const ingredientKey = item.ingredientCustomizations
    ? Object.entries(item.ingredientCustomizations)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join(",")
    : "";
  return `${item.menuItemId}|${normalizeNotes(item.notes)}|${normalizeOptions(item.optionItemIds)}|${ingredientKey}`;
}

function createCartLineId(menuItemId: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${menuItemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, items: action.items };
    case "ADD_ITEM": {
      const incomingNotes = normalizeNotes(action.item.notes);
      const incomingQuantity = Math.min(Math.max(action.item.quantity, 1), 99);
      const incomingKey = cartLineKey(action.item);
      const existing = state.items.find(
        (i) => cartLineKey(i) === incomingKey,
      );

      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === existing.id
              ? { ...i, quantity: i.quantity + incomingQuantity }
              : i,
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            ...action.item,
            id: createCartLineId(action.item.menuItemId),
            notes: incomingNotes,
            quantity: incomingQuantity,
          },
        ],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.id),
      };
    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.id !== action.id),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i,
        ),
      };
    }
    case "UPDATE_NOTES":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, notes: normalizeNotes(action.notes) } : i,
        ),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "SET_OPEN":
      return { ...state, isOpen: action.open };
    default:
      return state;
  }
}

const STORAGE_KEY = "lanchonete-cart";

const CartContext = createContext<{
  state: CartState;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes?: string | null) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
} | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          const hydratedItems = parsed
            .map((item) => {
              if (!item || typeof item !== "object") return null;

              const menuItemId =
                typeof item.menuItemId === "string"
                  ? item.menuItemId
                  : typeof item.id === "string"
                    ? item.id
                    : null;

              if (!menuItemId || typeof item.name !== "string") return null;

              return {
                id:
                  typeof item.id === "string" && item.id.length > 0
                    ? item.id
                    : createCartLineId(menuItemId),
                menuItemId,
                name: item.name,
                price: Number(item.price) || 0,
                imageUrl:
                  typeof item.imageUrl === "string" ? item.imageUrl : null,
                categoryName:
                  typeof item.categoryName === "string" ? item.categoryName : "",
                categoryAvailability:
                  item.categoryAvailability && typeof item.categoryAvailability === "object"
                    ? {
                        availableFrom:
                          typeof item.categoryAvailability.availableFrom === "string"
                            ? item.categoryAvailability.availableFrom
                            : null,
                        availableUntil:
                          typeof item.categoryAvailability.availableUntil === "string"
                            ? item.categoryAvailability.availableUntil
                            : null,
                      }
                    : undefined,
                quantity:
                  typeof item.quantity === "number" && item.quantity > 0
                    ? Math.min(Math.floor(item.quantity), 99)
                    : 1,
                notes: normalizeNotes(
                  typeof item.notes === "string" ? item.notes : null,
                ),
                optionItemIds: Array.isArray(item.optionItemIds)
                  ? item.optionItemIds.filter((id: unknown) => typeof id === "string")
                  : [],
                optionNames: Array.isArray(item.optionNames)
                  ? item.optionNames.filter((n: unknown) => typeof n === "string")
                  : [],
                optionDelta: typeof item.optionDelta === "number" ? item.optionDelta : 0,
                ingredientCustomizations:
                  item.ingredientCustomizations &&
                  typeof item.ingredientCustomizations === "object"
                    ? (Object.fromEntries(
                        Object.entries(item.ingredientCustomizations).filter(
                          ([k, v]) => typeof k === "string" && typeof v === "number",
                        ),
                      ) as Record<string, number>)
                    : undefined,
                ingredientNames:
                  item.ingredientNames &&
                  typeof item.ingredientNames === "object"
                    ? (Object.fromEntries(
                        Object.entries(item.ingredientNames).filter(
                          ([k, v]) => typeof k === "string" && typeof v === "string",
                        ),
                      ) as Record<string, string>)
                    : undefined,
              } satisfies CartItem;
            })
            .filter(Boolean) as CartItem[];

          dispatch({ type: "HYDRATE", items: hydratedItems });
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore quota errors
    }
  }, [state.items]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_ITEM", id });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", id, quantity });
  }, []);

  const updateNotes = useCallback((id: string, notes?: string | null) => {
    dispatch({ type: "UPDATE_NOTES", id, notes });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const openCart = useCallback(() => {
    dispatch({ type: "SET_OPEN", open: true });
  }, []);

  const closeCart = useCallback(() => {
    dispatch({ type: "SET_OPEN", open: false });
  }, []);

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + (item.price + (item.optionDelta || 0)) * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        clearCart,
        openCart,
        closeCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
