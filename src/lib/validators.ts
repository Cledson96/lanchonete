import { z } from "zod";
import { MENU_WEEKDAYS } from "@/lib/menu/availability";
import { normalizePhone, normalizeZipCode, optionalTrimmed } from "@/lib/utils";

const stringField = z.string().trim();
const optionalStringField = stringField.optional().transform(optionalTrimmed);
const timeField = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido.")
  .optional()
  .transform(optionalTrimmed);
const requiredTimeField = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido.");

export const paymentMethodSchema = z.enum([
  "dinheiro",
  "cartao_credito",
  "cartao_debito",
  "pix",
  "outro",
]);

export const menuItemKindSchema = z.enum(["simples", "combo"]);
const menuWeekdaySchema = z.enum(MENU_WEEKDAYS.map((weekday) => weekday.value) as [string, ...string[]]);

export const orderTypeSchema = z.enum(["delivery", "retirada", "local"]);

export const orderStatusSchema = z.enum([
  "novo",
  "em_preparo",
  "pronto",
  "saiu_para_entrega",
  "entregue",
  "fechado",
  "cancelado",
]);

export const phoneSchema = stringField
  .min(10, "Telefone invalido.")
  .transform(normalizePhone)
  .refine((value) => value.length >= 12 && value.length <= 13, {
    message: "Telefone invalido.",
  });

export const ingredientCustomizationSchema = z.object({
  ingredientId: stringField.min(1),
  quantity: z.coerce.number().int().min(0).max(10),
});

export const orderItemSchema = z.object({
  menuItemId: stringField.min(1),
  quantity: z.coerce.number().int().min(1).max(99),
  notes: optionalStringField,
  optionItemIds: z.array(stringField.min(1)).optional().default([]),
  ingredients: z.array(ingredientCustomizationSchema).optional().default([]),
});

export const addressSchema = z.object({
  street: stringField.min(2),
  number: stringField.min(1),
  complement: optionalStringField,
  neighborhood: stringField.min(2),
  city: stringField.min(2),
  state: stringField.min(2).max(2),
  zipCode: z
    .string()
    .optional()
    .transform((value) => normalizeZipCode(value)),
  reference: optionalStringField,
});

export const verificationRequestSchema = z.object({
  phone: phoneSchema,
  customerName: optionalStringField,
});

export const customerLookupSchema = z.object({
  phone: phoneSchema,
});

export const verificationConfirmSchema = z.object({
  phone: phoneSchema,
  code: stringField.regex(/^\d{6}$/, "Codigo invalido."),
  customerName: optionalStringField,
});

export const deliveryQuoteSchema = z.object({
  street: stringField.min(2),
  number: stringField.min(1),
  zipCode: z
    .string()
    .optional()
    .transform((value) => normalizeZipCode(value)),
  neighborhood: stringField.min(2),
  city: stringField.min(2),
  state: stringField.min(2).max(2),
  subtotalAmount: z.coerce.number().min(0).optional(),
});

export const createOrderSchema = z.object({
  customerName: stringField.min(2),
  customerPhone: phoneSchema,
  type: orderTypeSchema,
  paymentMethod: paymentMethodSchema,
  notes: optionalStringField,
  items: z.array(orderItemSchema).min(1),
  address: addressSchema.optional(),
});

export const adminLoginSchema = z.object({
  email: stringField.email(),
  password: stringField.min(6),
});

export const createCategorySchema = z.object({
  name: stringField.min(2),
  slug: optionalStringField,
  description: optionalStringField,
  sortOrder: z.coerce.number().int().min(0).default(0),
  availableFrom: timeField,
  availableUntil: timeField,
  isActive: z.coerce.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: stringField.min(1),
});

export const deleteCategorySchema = z.object({
  id: stringField.min(1),
  strategy: z.enum(["delete_items", "move_items"]),
  targetCategoryId: stringField.min(1).optional(),
}).superRefine((value, ctx) => {
  if (value.strategy === "move_items" && !value.targetCategoryId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetCategoryId"],
      message: "Selecione a categoria de destino.",
    });
  }
});

export const createMenuItemSchema = z.object({
  categoryId: stringField.min(1),
  name: stringField.min(2),
  slug: optionalStringField,
  description: optionalStringField,
  kind: menuItemKindSchema.default("simples"),
  imageUrl: z
    .string()
    .trim()
    .refine((value) => !value || value.startsWith("/") || z.string().url().safeParse(value).success, {
      message: "Informe uma URL valida ou um caminho local iniciado com /.",
    })
    .optional()
    .or(z.literal(""))
    .transform(optionalTrimmed),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  availableWeekdays: z.array(menuWeekdaySchema).default([]),
  optionGroupIds: z.array(stringField.min(1)).optional().default([]),
  ingredientIds: z.array(stringField.min(1)).optional().default([]),
  comboComponents: z
    .array(
      z.object({
        componentMenuItemId: stringField.min(1),
        quantity: z.coerce.number().int().min(1).max(99).default(1),
      }),
    )
    .optional()
    .default([]),
});

export const updateMenuItemSchema = z.object({
  id: stringField.min(1),
  categoryId: stringField.min(1).optional(),
  name: stringField.min(2).optional(),
  slug: optionalStringField,
  description: optionalStringField,
  kind: menuItemKindSchema.optional(),
  imageUrl: z
    .string()
    .trim()
    .refine((value) => !value || value.startsWith("/") || z.string().url().safeParse(value).success, {
      message: "Informe uma URL valida ou um caminho local iniciado com /.",
    })
    .optional()
    .or(z.literal(""))
    .transform(optionalTrimmed),
  price: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  availableWeekdays: z.array(menuWeekdaySchema).optional(),
  optionGroupIds: z.array(stringField.min(1)).optional(),
  ingredientIds: z.array(stringField.min(1)).optional(),
  comboComponents: z
    .array(
      z.object({
        componentMenuItemId: stringField.min(1),
        quantity: z.coerce.number().int().min(1).max(99),
      }),
    )
    .optional(),
});

const optionItemInputSchema = z.object({
  id: stringField.min(1).optional(),
  name: stringField.min(2),
  slug: optionalStringField,
  description: optionalStringField,
  priceDelta: z.coerce.number().min(0).default(0),
  isDefault: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const createOptionGroupSchema = z.object({
  name: stringField.min(2),
  slug: optionalStringField,
  description: optionalStringField,
  minSelections: z.coerce.number().int().min(0).default(0),
  maxSelections: z.coerce.number().int().min(1).optional(),
  isRequired: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
  options: z.array(optionItemInputSchema).default([]),
});

export const updateOptionGroupSchema = createOptionGroupSchema.partial().extend({
  id: stringField.min(1),
  options: z.array(optionItemInputSchema).optional(),
});

export const createDeliveryFeeRuleSchema = z.object({
  label: stringField.min(2),
  neighborhood: optionalStringField,
  city: stringField.min(2),
  state: stringField.min(2).max(2),
  zipCodeStart: z
    .string()
    .optional()
    .transform((value) => normalizeZipCode(value)),
  zipCodeEnd: z
    .string()
    .optional()
    .transform((value) => normalizeZipCode(value)),
  maxDistanceKm: z.coerce.number().positive().max(100),
  feeAmount: z.coerce.number().min(0),
  minimumOrderAmount: z.coerce.number().min(0).optional(),
  freeAboveAmount: z.coerce.number().min(0).optional(),
  estimatedMinMinutes: z.coerce.number().int().min(0).optional(),
  estimatedMaxMinutes: z.coerce.number().int().min(0).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const updateDeliveryFeeRuleSchema = createDeliveryFeeRuleSchema
  .partial()
  .extend({
    id: stringField.min(1),
  });

export const updateStoreSettingsSchema = z.object({
  store: z.object({
    name: stringField.min(2),
    zipCode: z
      .string()
      .optional()
      .transform((value) => normalizeZipCode(value)),
    street: stringField.min(2),
    number: stringField.min(1),
    neighborhood: optionalStringField,
    city: stringField.min(2),
    state: stringField.min(2).max(2).transform((value) => value.toUpperCase()),
    maxDeliveryDistanceKm: z.coerce.number().positive().max(100),
  }),
  businessHours: z.array(
    z.object({
      weekday: menuWeekdaySchema,
      opensAt: requiredTimeField,
      closesAt: requiredTimeField,
      isOpen: z.coerce.boolean(),
    }),
  ).length(MENU_WEEKDAYS.length),
});

export const addComandaItemsSchema = z.object({
  items: z.array(orderItemSchema).min(1),
});

export const createComandaSchema = z.object({
  name: stringField.min(2, "Informe o nome do cliente."),
  notes: optionalStringField,
});

export const closeComandaSchema = z.object({
  paymentMethod: paymentMethodSchema,
});

export const updateOrderStatusSchema = z.object({
  toStatus: orderStatusSchema,
  note: optionalStringField,
});

export const updateOrderItemUnitStatusSchema = z.object({
  toStatus: z.enum(["em_preparo", "pronto", "entregue", "cancelado"]),
  source: z.enum(["operation", "kitchen"]).default("operation"),
});

export const sendWhatsAppConversationMessageSchema = z.object({
  content: stringField.min(1).max(2000),
});

export const updateWhatsAppConversationInboxSchema = z.object({
  priority: z.enum(["low", "normal", "high"]).optional(),
  ownerId: z.union([stringField.min(1), z.null()]).optional(),
});
