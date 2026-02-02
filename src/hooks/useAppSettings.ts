import { useQuery } from "@tanstack/react-query";
import { getAppSettings } from "@/lib/appSettingsApi";

export function useAppSettings() {
  return useQuery({
    queryKey: ["app_settings"],
    queryFn: getAppSettings,
  });
}
