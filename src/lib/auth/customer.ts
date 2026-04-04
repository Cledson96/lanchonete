import { ApiError } from "@/lib/http";
import { getCustomerSession } from "@/lib/auth/session";

export async function requireCustomer() {
  const session = await getCustomerSession();

  if (!session) {
    throw new ApiError(401, "Cliente nao autenticado.");
  }

  return session;
}
