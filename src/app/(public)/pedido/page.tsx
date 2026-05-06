import { PedidoCheckout } from "@/components/pedido-checkout";
import { getPublicStoreStatus } from "@/lib/services/store-settings-service";

export const dynamic = "force-dynamic";

export default async function PedidoPage() {
  const storeStatus = await getPublicStoreStatus();

  return <PedidoCheckout initialStoreStatus={storeStatus} />;
}
