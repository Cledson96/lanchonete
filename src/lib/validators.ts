import { z } from "zod";
import { normalizePhone, normalizeZipCode, optionalTrimmed } from "@/lib/utils";

const stringField = z.string().trim();
const optionalStringField = stringField.optional().transform(optionalTrimmed);

export const paymentMethodSchema = z.enum([
  "dinheiro",
  "cartao_credito",
  "cartao_debito",
  "pix",
  "outro",
]);

export const orderTypeSchema = z.enum(["delivery", "retirada", "local"]);

export const orderStatusSchema = z.enum([
  "novo",
  "aceito",
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

export const orderItemSchema = z.object({
  menuItemId: stringField.min(1),
  quantity: z.coerce.number().int().min(1).max(99),
  notes: optionalStringField,
  optionItemIds: z.array(stringField.min(1)).optional().default([]),
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

export const verificationConfirmSchema = z.object({
  phone: phoneSchema,
  code: stringField.regex(/^\d{6}$/, "Codigo invalido."),
  customerName: optionalStringField,
});

export const deliveryQuoteSchema = z.object({
  zipCode: z
    .string()
    .optional()
    .transform((value) => normalizeZipCode(value)),
  neighborhood: optionalStringField,
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
  isActive: z.coerce.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: stringField.min(1),
});

export const createMenuItemSchema = z.object({
  categoryId: stringField.min(1),
  name: stringField.min(2),
  slug: optionalStringField,
  description: optionalStringField,
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
  optionGroupIds: z.array(stringField.min(1)).optional().default([]),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  id: stringField.min(1),
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

export const addComandaItemsSchema = z.object({
  items: z.array(orderItemSchema).min(1),
});

export const closeComandaSchema = z.object({
  paymentMethod: paymentMethodSchema,
});

export const updateOrderStatusSchema = z.object({
  toStatus: orderStatusSchema,
  note: optionalStringField,
});
