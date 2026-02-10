import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatPrice } from '@/lib/utils';
import type { RoomPriceBreakdownItem } from '@/types';

interface RoomPriceBreakdownProps {
  breakdown: RoomPriceBreakdownItem[];
  roomName?: string;
  compact?: boolean;
  className?: string;
}

function modifierText(row: RoomPriceBreakdownItem): string {
  if (row.label === 'Giá gốc' || !row.modifierType) return '—';
  const v = row.modifierValue ?? 0;
  if (row.modifierType === 'percentage') return `+${v}%`;
  return `+${formatPrice(v)}`;
}

/** Hiển thị bảng chi tiết giá từng ngày (khi có giá đặc biệt). */
export function RoomPriceBreakdown({
  breakdown,
  roomName,
  compact,
  className = '',
}: RoomPriceBreakdownProps) {
  if (!breakdown || breakdown.length === 0) return null;

  const hasDetails = breakdown.some((r) => r.basePrice != null || r.modifierType != null);

  return (
    <div className={className}>
      <p className="text-sm font-medium text-muted-foreground mb-2">
        Chi tiết giá từng ngày{roomName ? ` - ${roomName}` : ''}
      </p>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-2 px-3">Ngày</th>
              <th className="text-left py-2 px-3">Lý do</th>
              {!compact && hasDetails && (
                <>
                  <th className="text-right py-2 px-3">Giá gốc</th>
                  <th className="text-left py-2 px-3">Cách tăng</th>
                </>
              )}
              <th className="text-right py-2 px-3">Giá/đêm</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="py-2 px-3">
                  {format(new Date(row.date), 'dd/MM/yyyy', { locale: vi })}
                </td>
                <td className="py-2 px-3 text-muted-foreground">
                  {row.label || 'Giá gốc'}
                </td>
                {!compact && hasDetails && (
                  <>
                    <td className="py-2 px-3 text-right">
                      {row.basePrice != null ? formatPrice(row.basePrice) : '—'}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {modifierText(row)}
                    </td>
                  </>
                )}
                <td className="py-2 px-3 text-right font-medium">
                  {formatPrice(row.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Tổng tiền phòng: <span className="font-semibold text-foreground">
          {formatPrice(breakdown.reduce((s, r) => s + r.price, 0))}
        </span>
      </p>
    </div>
  );
}
