import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { listOrders } from "@/lib/services/order-admin-service";
import { orderStatusSchema, orderTypeSchema } from "@/lib/validators";
import { z } from "zod";

const channelSchema = z.enum(["web", "whatsapp", "local"]);

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const channel = url.searchParams.get("channel");
    const type = url.searchParams.get("type");

    const orders = await listOrders({
      status: status ? orderStatusSchema.parse(status) : undefined,
      channel: channel ? channelSchema.parse(channel) : undefined,
      type: type ? orderTypeSchema.parse(type) : undefined,
    });

    return ok({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}
