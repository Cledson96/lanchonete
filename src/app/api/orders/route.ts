import { requireCustomer } from "@/lib/auth/customer";
import { config } from "@/lib/config";
import { serializeCheckoutOrderSummary } from "@/lib/checkout/serializers";
import { ApiError, handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp";
import { createOrder } from "@/lib/services/order-service";
import { buildOrderConfirmationMessage } from "@/lib/services/order-confirmation-message";
import { createOrderSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await requireCustomer();
    const input = await readRequestBody(request, createOrderSchema);

    if (session.phone !== input.customerPhone) {
      throw new ApiError(403, "O telefone do pedido precisa ser o mesmo telefone validado.");
    }

    const order = await createOrder({
      ...input,
      customerProfileId: session.customerProfileId,
    });

    const confirmationMessage = buildOrderConfirmationMessage(order, {
      pixKey: config.storePixKey,
      publicSiteUrl: config.publicSiteUrl,
      paymentMethodFallback: input.paymentMethod,
    });

    try {
      await sendWhatsAppTextMessage({
        to: session.phone,
        body: confirmationMessage,
      });
    } catch (error) {
      console.error("[orders:web:whatsapp-confirmation]", error);
    }

    return ok(
      {
        order: serializeCheckoutOrderSummary({
          ...order,
          paymentMethod: order.paymentMethod ?? input.paymentMethod,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
