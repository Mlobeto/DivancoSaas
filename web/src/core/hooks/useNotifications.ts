import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/services/notification.service";
import { useAuthStore } from "@/store/auth.store";

export function useNotifications() {
  const queryClient = useQueryClient();
  const { businessUnit } = useAuthStore();
  const businessUnitId = businessUnit?.id;

  // El queryKey incluye la BU activa: al cambiar de BU se recarga automáticamente
  const queryKey = ["notifications", businessUnitId];

  const { data, isLoading } = useQuery({
    queryKey,
    // businessUnitId llega al backend vía header X-Business-Unit-Id (interceptor Axios)
    // El queryKey lo incluye para que React Query invalide el cache al cambiar de BU
    queryFn: () => notificationService.list({ limit: 50 }),
    refetchInterval: 30_000, // polling cada 30 seg
    staleTime: 15_000,
    enabled: !!businessUnitId,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    notifications: data?.items ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}
