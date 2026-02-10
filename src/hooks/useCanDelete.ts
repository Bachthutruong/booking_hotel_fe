import { useAuthStore } from '@/store/authStore';

/**
 * Chỉ admin mới được xóa (tạo/sửa/xóa user, xóa phòng, khách sạn, v.v.).
 * Nhân viên (staff) không thấy và không thể dùng các nút xóa.
 */
export function useCanDelete(): boolean {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'admin';
}
