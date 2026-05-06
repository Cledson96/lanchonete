import { DashboardSettingsManager } from "@/components/dashboard-settings-manager";
import { getStoreSettings } from "@/lib/services/store-settings-service";

export default async function DashboardConfiguracoesPage() {
  const settings = await getStoreSettings();

  return <DashboardSettingsManager initialSettings={settings} />;
}
