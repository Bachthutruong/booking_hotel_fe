import { forwardRef } from 'react';
import { Building2, Phone, Mail, MapPin, Calendar, User, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Invoice } from '@/types';

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface InvoicePrintProps {
  invoice: Invoice;
}

export const InvoicePrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice }, ref) => {
    const paymentMethodLabels: Record<string, string> = {
      bank_transfer: 'Chuyển khoản',
      wallet: 'Ví điện tử',
      cash: 'Tiền mặt',
    };

    const statusLabels: Record<string, string> = {
      pending: 'Chờ xử lý',
      pending_deposit: 'Chờ đặt cọc',
      awaiting_approval: 'Chờ duyệt',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };

    return (
      <div id="invoice-print" ref={ref} className="bg-white p-8 max-w-2xl mx-auto print:p-4 print:max-w-none">
        {/* Header */}
        <div className="text-center border-b pb-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">JiudiBooking</span>
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider mt-4">Hóa Đơn Thanh Toán</h1>
          <p className="text-sm text-muted-foreground mt-1">Invoice / Receipt</p>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Số hóa đơn:</p>
            <p className="font-semibold">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Ngày lập:</p>
            <p className="font-semibold">{formatDateTime(invoice.createdAt)}</p>
          </div>
        </div>

        {/* Hotel Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 print:bg-gray-100">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> {invoice.hotel.name}
          </h3>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="h-3 w-3" /> {invoice.hotel.address}, {invoice.hotel.city}
            </p>
          </div>
        </div>

        {/* Guest Info */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <User className="h-4 w-4" /> Thông tin khách hàng
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Họ tên:</p>
              <p className="font-medium">{invoice.guest.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Điện thoại:</p>
              <p className="font-medium">{invoice.guest.phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Email:</p>
              <p className="font-medium">{invoice.guest.email}</p>
            </div>
          </div>
        </div>

        {/* Stay Info */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Thông tin lưu trú
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Phòng:</p>
              <p className="font-medium">{invoice.room.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Số đêm:</p>
              <p className="font-medium">{invoice.nights} đêm</p>
            </div>
            <div>
              <p className="text-muted-foreground">Check-in:</p>
              <p className="font-medium">{formatDate(invoice.checkIn)}</p>
              {invoice.actualCheckIn && (
                <p className="text-xs text-muted-foreground">Thực tế: {formatDateTime(invoice.actualCheckIn)}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Check-out:</p>
              <p className="font-medium">{formatDate(invoice.checkOut)}</p>
              {invoice.actualCheckOut && (
                <p className="text-xs text-muted-foreground">Thực tế: {formatDateTime(invoice.actualCheckOut)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">
            Chi tiết hóa đơn
            {invoice.roomPriceBreakdown && invoice.roomPriceBreakdown.length > 0 && (
              <span className="block text-xs font-normal text-muted-foreground mt-1">
                Chi tiết giá từng ngày (áp dụng giá đặc biệt)
              </span>
            )}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2">Mô tả</th>
                <th className="text-center py-2">SL</th>
                <th className="text-right py-2">Đơn giá</th>
                <th className="text-right py-2">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2">{item.description}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">{formatPrice(item.unitPrice)}</td>
                  <td className="text-right py-2 font-medium">{formatPrice(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary: Tạm tính, Tổng đã thanh toán, Tổng cộng. Chỉ hiện "Còn lại" khi thật sự còn nợ. */}
        <div className="border-t pt-4">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Tạm tính:</span>
            <span>{formatPrice(invoice.subtotal)}</span>
          </div>
          {(() => {
            const paidDeposit = invoice.paidDepositAmount ?? 0;
            const paidWallet = invoice.paidFromWallet ?? 0;
            const paidBonus = invoice.paidFromBonus ?? 0;
            const isPaidByCash = invoice.paymentStatus === 'paid' && invoice.paymentMethod === 'cash';
            const walletAndBonus = paidWallet + paidBonus;
            // Tránh cộng cọc 2 lần: cọc từ ví đã nằm trong paidWallet → chỉ cộng thêm phần cọc trả bằng CK
            const totalPaid = isPaidByCash
              ? invoice.subtotal
              : Math.min(walletAndBonus + Math.max(0, paidDeposit - paidWallet), invoice.subtotal);
            const amountAfterDeposit = Math.max(0, invoice.subtotal - paidDeposit);
            const cashAtCounter = Math.max(0, invoice.subtotal - paidDeposit - paidWallet - paidBonus);
            if (totalPaid <= 0) return null;
            return (
              <>
                <div className="flex justify-between py-1 text-green-600 font-medium">
                  <span>Tổng đã thanh toán:</span>
                  <span>-{formatPrice(totalPaid)}</span>
                </div>
                <div className="pl-3 text-xs text-muted-foreground space-y-0.5 border-l-2 border-green-200">
                  {paidDeposit > 0 && (
                    <div className="flex justify-between">
                      <span>Trong đó đã cọc:</span>
                      <span>{formatPrice(paidDeposit)}</span>
                    </div>
                  )}
                  {amountAfterDeposit > 0 && (paidWallet > 0 || paidBonus > 0) && !isPaidByCash && (
                    <div className="flex justify-between">
                      <span>Thanh toán từ ví / tiền mặt (tổng − đã cọc):</span>
                      <span>{formatPrice(amountAfterDeposit)}</span>
                    </div>
                  )}
                  {paidBonus > 0 && (
                    <div className="flex justify-between">
                      <span>Tiền khuyến mãi:</span>
                      <span>{formatPrice(paidBonus)}</span>
                    </div>
                  )}
                  {isPaidByCash && cashAtCounter > 0 && (
                    <div className="flex justify-between">
                      <span>Thanh toán tiền mặt tại quầy:</span>
                      <span>{formatPrice(cashAtCounter)}</span>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
          <div className="flex justify-between py-2 text-lg font-bold border-t mt-2">
            <span>Tổng cộng:</span>
            <span className="text-primary">{formatPrice(invoice.finalAmount)}</span>
          </div>
          {(() => {
            const paidDeposit = invoice.paidDepositAmount ?? 0;
            const paidWallet = invoice.paidFromWallet ?? 0;
            const paidBonus = invoice.paidFromBonus ?? 0;
            const isPaidByCash = invoice.paymentStatus === 'paid' && invoice.paymentMethod === 'cash';
            const walletAndBonus = paidWallet + paidBonus;
            const totalPaid = isPaidByCash
              ? invoice.subtotal
              : Math.min(walletAndBonus + Math.max(0, paidDeposit - paidWallet), invoice.subtotal);
            const remaining = Math.max(0, invoice.subtotal - totalPaid);
            if (remaining === 0) return null;
            return (
              <div className="flex justify-between py-1 text-amber-600 font-medium text-sm">
                <span>Còn lại cần thanh toán:</span>
                <span>{formatPrice(remaining)}</span>
              </div>
            );
          })()}
        </div>

        {/* Payment Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg print:bg-gray-100">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Thông tin thanh toán
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Phương thức:</p>
              <p className="font-medium">{paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Trạng thái:</p>
              <p className={`font-medium ${
                invoice.paymentStatus === 'paid' ? 'text-green-600' :
                invoice.paymentStatus === 'deposit_paid' ? 'text-teal-600' : 'text-amber-600'
              }`}>
                {invoice.paymentStatus === 'paid' ? 'Đã thanh toán toàn bộ' :
                 invoice.paymentStatus === 'deposit_paid' ? 'Đã thanh toán tiền cọc' : 'Chưa thanh toán'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
          <p className="mt-1">Thank you for staying with us!</p>
          <p className="mt-4 text-xs">
            JiudiBooking - Hệ thống đặt phòng khách sạn trực tuyến
          </p>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-print, #invoice-print * {
              visibility: visible;
            }
            #invoice-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </div>
    );
  }
);

InvoicePrint.displayName = 'InvoicePrint';

export default InvoicePrint;
