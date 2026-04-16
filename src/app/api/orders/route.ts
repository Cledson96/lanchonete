import { requireCustomer } from "@/lib/auth/customer";
import { config } from "@/lib/config";
import { handleRouteError, ok } from "@/lib/http";
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
      return new Response(
        JSON.stringify({
          error: {
            message:
              "O telefone do pedido precisa ser o mesmo telefone validado.",
          },
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const order = await createOrder({
      ...input,
      customerProfileId: session.customerProfileId,
    });

    const confirmationMessage = buildOrderConfirmationMessage(order, {
      pixKey: config.storePixKey,
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

    return ok({ order }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
