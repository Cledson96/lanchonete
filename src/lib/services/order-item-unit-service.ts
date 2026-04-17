import { buildOrderItemUnits } from "@/lib/order-item-units";
import { prisma } from "@/lib/prisma";

export async function syncMissingOrderItemUnits() {
  const itemsWithoutUnits = await prisma.orderItem.findMany({
    where: {
      units: {
        none: {},
      },
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  for (const item of itemsWithoutUnits) {
    await prisma.orderItemUnit.createMany({
      data: buildOrderItemUnits(item.quantity).map((unit) => ({
        orderItemId: item.id,
        sequence: unit.sequence,
        status: unit.status,
      })),
      skipDuplicates: true,
    });
  }
}
