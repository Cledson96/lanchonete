import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

export async function getCustomerByPhone(phone: string) {
  return prisma.customerProfile.findUnique({
    where: { phone: normalizePhone(phone) },
    include: {
      addresses: true,
    },
  });
}

export async function getCustomerById(customerProfileId: string) {
  return prisma.customerProfile.findUnique({
    where: { id: customerProfileId },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              menuItem: true,
              selectedOptions: {
                include: {
                  optionItem: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
