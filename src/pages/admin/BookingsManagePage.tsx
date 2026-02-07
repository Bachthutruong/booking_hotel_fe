import { useState, useRef, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isWithinInterval, 
  startOfWeek, 
  endOfWeek,
  getYear,
  getMonth,
  setMonth,
  setYear
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import {
  Search,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  Check,
  X,
  CreditCard,
  LogIn,
  LogOut,
  Printer,
  Wallet,
  Receipt,
  List,
  CalendarDays,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { bookingService } from '@/services/bookingService';
import { hotelService } from '@/services/hotelService';
import { toast } from '@/hooks/use-toast';
import { formatPrice, getStatusText, getStatusColor } from '@/lib/utils';
import { InvoicePrint } from '@/components/InvoicePrint';
import type { ApiResponse, Booking, Hotel, Room, User, Invoice, PaymentOption, Service } from '@/types';

// Status colors for calendar
const statusCalendarColors: Record<string, { bg: string; border: string; text: string }> = {
  pending_deposit: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' },
  awaiting_approval: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800' },
  confirmed: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800' },
  cancelled: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500' },
  pending: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800' },
};

export function BookingsManagePage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const openBookingId = searchParams.get('open');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Filters
  const [status, setStatus] = useState<string>('all');
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  
  // Search and Date Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [checkInStart, setCheckInStart] = useState('');
  const [checkInEnd, setCheckInEnd] = useState('');

  // Pagination for list view
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updateDialog, setUpdateDialog] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [selectedDateDialog, setSelectedDateDialog] = useState<Date | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Checkout dialog state
  const [checkoutDialog, setCheckoutDialog] = useState<Booking | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('use_bonus');
  const [checkoutNote, setCheckoutNote] = useState('');
  const [billData, setBillData] = useState<any>(null);

  // Invoice state
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: invoicePrintRef,
  });

  // Fetch hotels for filter
  const { data: hotelsData } = useQuery({
    queryKey: ['hotelsList'],
    queryFn: () => hotelService.getHotels({ limit: 100 }),
  });
  const hotels = hotelsData?.data || [];

  // Fetch rooms when hotel selected
  const { data: roomsData } = useQuery({
    queryKey: ['roomsList', selectedHotel],
    queryFn: () => selectedHotel !== 'all' ? hotelService.getRooms(selectedHotel, { limit: 100 }) : Promise.resolve({ data: [], success: true, pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
    enabled: selectedHotel !== 'all',
  });
  const rooms = roomsData?.data || [];

  // Reset room selection when hotel changes
  useEffect(() => {
    setSelectedRoom('all');
  }, [selectedHotel]);

  // Fetch bookings for list view
  const { data, isLoading } = useQuery({
    queryKey: ['adminBookings', { status, page, limit, selectedHotel, selectedRoom, debouncedSearch, checkInStart, checkInEnd }],
    queryFn: () => bookingService.getBookings({ 
        status: status === 'all' ? undefined : status, 
        page, 
        limit,
        hotelId: selectedHotel === 'all' ? undefined : selectedHotel,
        roomId: selectedRoom === 'all' ? undefined : selectedRoom,
        search: debouncedSearch || undefined,
        checkInStart: checkInStart || undefined,
        checkInEnd: checkInEnd || undefined
    }),
    enabled: viewMode === 'list',
  });

  // Fetch bookings for calendar view
  // We need to fetch bookings for the current month range
  const calendarRange = useMemo(() => {
      const start = startOfWeek(startOfMonth(calendarDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(calendarDate), { weekStartsOn: 1 });
      return {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd')
      };
  }, [calendarDate]);

  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ['adminBookingsCalendar', { status, selectedHotel, selectedRoom, debouncedSearch, ...calendarRange }],
    queryFn: () => bookingService.getBookings({ 
        status: status === 'all' ? undefined : status, 
        limit: 1000, // Get enough for month view
        hotelId: selectedHotel === 'all' ? undefined : selectedHotel,
        roomId: selectedRoom === 'all' ? undefined : selectedRoom,
        startDate: calendarRange.start,
        endDate: calendarRange.end,
        search: debouncedSearch || undefined
    }),
    enabled: viewMode === 'calendar',
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, paymentStatus }: { id: string; status?: string; paymentStatus?: string }) =>
      bookingService.updateBookingStatus(id, status, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookingsCalendar'] });
      setUpdateDialog(null);
      toast({ title: 'Thành công', description: 'Đã cập nhật trạng thái đơn hàng' });
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái', variant: 'destructive' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      bookingService.approveBooking(id, action),
    onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
        queryClient.invalidateQueries({ queryKey: ['adminBookingsCalendar'] });
        setSelectedBooking(null);
        toast({
            title: 'Thành công',
            description: variables.action === 'approve' ? 'Đã duyệt thanh toán' : 'Đã từ chối thanh toán'
        });
    },
    onError: () => {
        toast({ title: 'Lỗi', description: 'Không thể xử lý yêu cầu', variant: 'destructive' });
    }
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => bookingService.checkIn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookingsCalendar'] });
      setSelectedBooking(null);
      toast({ title: 'Thành công', description: 'Đã check-in thành công' });
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể check-in', variant: 'destructive' });
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: ({ id, paymentOption, checkoutNote }: { id: string; paymentOption: PaymentOption; checkoutNote?: string }) =>
      bookingService.checkout(id, paymentOption, checkoutNote),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookingsCalendar'] });
      setCheckoutDialog(null);
      setBillData(null);
      setCheckoutNote('');
      toast({
        title: 'Checkout thành công',
        description: `Đã trừ ${formatPrice(response.data?.payment.paidFromWallet || 0)} từ ví + ${formatPrice(response.data?.payment.paidFromBonus || 0)} tiền khuyến mãi`,
      });
      if (response.data?.booking._id) {
        fetchInvoice(response.data.booking._id);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể checkout',
        variant: 'destructive'
      });
    }
  });

  const [deliveringIndex, setDeliveringIndex] = useState<number | null>(null);

  const markDeliveredMutation = useMutation({
    mutationFn: ({ bookingId, serviceIndex }: { bookingId: string; serviceIndex: number }) =>
      bookingService.markServiceDelivered(bookingId, serviceIndex),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookingsCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] });
      const updated = (response as ApiResponse<Booking>)?.data;
      if (updated && selectedBooking?._id === variables.bookingId) {
        setSelectedBooking(updated);
      }
      setDeliveringIndex(null);
      toast({ title: 'Thành công', description: 'Đã xác nhận bàn giao dịch vụ' });
    },
    onError: () => {
      setDeliveringIndex(null);
      toast({ title: 'Lỗi', description: 'Không thể xác nhận bàn giao', variant: 'destructive' });
    },
  });

  const markAllDeliveredMutation = useMutation({
    mutationFn: (bookingId: string) => bookingService.markAllServicesDelivered(bookingId),
    onSuccess: (response, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookingsCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      const updated = (response as ApiResponse<Booking>)?.data;
      if (updated && selectedBooking?._id === bookingId) {
        setSelectedBooking(updated);
      }
      toast({ title: 'Thành công', description: 'Đã xác nhận bàn giao tất cả dịch vụ' });
    },
    onError: () => toast({ title: 'Lỗi', description: 'Không thể xác nhận bàn giao tất cả', variant: 'destructive' }),
  });

  // Mở chi tiết đơn khi có query open=bookingId (từ thông báo)
  useEffect(() => {
    if (!openBookingId) return;
    bookingService.getBooking(openBookingId).then((res) => {
      if (res.success && res.data) setSelectedBooking(res.data as Booking);
    });
  }, [openBookingId]);

  const fetchBill = async (booking: Booking) => {
    try {
      const response = await bookingService.getBill(booking._id);
      setBillData(response.data);
      setCheckoutDialog(booking);
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lấy thông tin hóa đơn', variant: 'destructive' });
    }
  };

  const fetchInvoice = async (bookingId: string) => {
    try {
      const response = await bookingService.getInvoice(bookingId);
      setInvoiceData(response.data || null);
    } catch (error) {
      console.error('Failed to fetch invoice');
    }
  };

  const handleCheckIn = (booking: Booking) => {
    checkInMutation.mutate(booking._id);
  };

  const handleCheckout = () => {
    if (!checkoutDialog) return;
    checkoutMutation.mutate({
      id: checkoutDialog._id,
      paymentOption,
      checkoutNote: checkoutNote || undefined,
    });
  };

  const bookings = data?.data || [];
  const calendarBookings = calendarData?.data || [];
  const pagination = data?.pagination;

  const handleUpdate = () => {
    if (!updateDialog) return;
    updateMutation.mutate({
      id: updateDialog._id,
      status: newStatus || undefined,
      paymentStatus: newPaymentStatus || undefined,
    });
  };

  const handleApprove = (action: 'approve' | 'reject') => {
      if (!selectedBooking) return;
      approveMutation.mutate({ id: selectedBooking._id, action });
  };

  // --- Calendar Logic ---
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [calendarDate]);

  const getBookingsForDate = (date: Date) => {
    return calendarBookings.filter((booking: Booking) => {
      // Just check if the date is within the range
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      // Include check-in day up to day before check-out
      return isWithinInterval(date, { 
          start: new Date(checkIn.setHours(0,0,0,0)), 
          end: new Date(new Date(checkOut).setDate(checkOut.getDate() - 1)) 
      });
    }).sort((a: Booking, b: Booking) => a._id.localeCompare(b._id));
  };

  // Years for filter
  const years = useMemo(() => {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đặt phòng</h1>
          <p className="text-muted-foreground">
            {viewMode === 'list' ? `${pagination?.total || 0} đơn đặt phòng` : 'Lịch đặt phòng'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-4 bg-muted/50 p-1.5 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Danh sách</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'calendar'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch</span>
          </button>
        </div>
      </div>

      {/* Global Filters */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Bộ lọc:
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, SĐT, mã đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[200px] sm:w-[250px] bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
              <Input
                 type="date"
                 value={checkInStart}
                 onChange={(e) => { setCheckInStart(e.target.value); setPage(1); }}
                 className="w-auto bg-white"
                 title="Ngày bắt đầu check-in"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                 type="date"
                 value={checkInEnd}
                 onChange={(e) => { setCheckInEnd(e.target.value); setPage(1); }}
                 className="w-auto bg-white"
                 title="Ngày kết thúc check-in"
              />
          </div>
          
          <Select value={selectedHotel} onValueChange={(v) => { setSelectedHotel(v); setPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tất cả khách sạn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khách sạn</SelectItem>
              {hotels.map((h: Hotel) => (
                  <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedHotel !== 'all' && (
              <Select value={selectedRoom} onValueChange={(v) => { setSelectedRoom(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng</SelectItem>
                  {rooms.map((r: Room) => (
                      <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          )}

          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending_deposit">Chờ đặt cọc</SelectItem>
              <SelectItem value="awaiting_approval">Chờ duyệt</SelectItem>
              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === 'list' && (
             <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Hiển thị:</span>
                <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Calendar Header with Controls */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCalendarDate(subMonths(calendarDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCalendarDate(addMonths(calendarDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 ml-2">
                    <Select 
                        value={getMonth(calendarDate).toString()} 
                        onValueChange={(v) => setCalendarDate(setMonth(calendarDate, parseInt(v)))}
                    >
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => (
                                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select 
                        value={getYear(calendarDate).toString()} 
                        onValueChange={(v) => setCalendarDate(setYear(calendarDate, parseInt(v)))}
                    >
                        <SelectTrigger className="w-[100px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="text-sm font-medium text-muted-foreground hidden sm:block">
                Hôm nay: {format(new Date(), 'dd/MM/yyyy')}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2 gap-1">
              {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2 bg-gray-50 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {calendarLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, calendarDate);
                  const isToday = isSameDay(day, new Date());
                  const dayBookings = getBookingsForDate(day);
                  
                  // Display ALL bookings active on this day, not just starting ones
                  const displayedBookings = dayBookings.slice(0, 3);
                  const hasMore = dayBookings.length > 3;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateDialog(day)}
                      className={`min-h-[120px] p-2 rounded-xl border transition-all cursor-pointer group hover:shadow-md hover:border-primary/30 flex flex-col gap-1 ${
                        !isCurrentMonth ? 'bg-gray-50/30 opacity-40 hover:opacity-100' : 'bg-white'
                      } ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      {/* Day Number */}
                      <div className="flex justify-between items-start">
                          <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                            isToday ? 'bg-primary text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {format(day, 'd')}
                          </span>
                          {dayBookings.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-1 h-5 min-w-[20px] justify-center bg-gray-100 text-gray-600">
                                  {dayBookings.length}
                              </Badge>
                          )}
                      </div>

                      {/* Bookings List */}
                      <div className="flex-1 flex flex-col gap-1 mt-1">
                        {displayedBookings.map((booking: Booking) => {
                            const colors = statusCalendarColors[booking.status] || statusCalendarColors.pending;
                            const hotel = booking.hotel as Hotel;
                            
                            const checkIn = new Date(booking.checkIn);
                            const checkOut = new Date(booking.checkOut);
                            const endDate = new Date(new Date(checkOut).setDate(checkOut.getDate() - 1));

                            const isStart = isSameDay(checkIn, day);
                            const isEnd = isSameDay(endDate, day);
                            const isMonday = day.getDay() === 1;
                            const isSunday = day.getDay() === 0;

                            const continuesLeft = !isStart && !isMonday;
                            const continuesRight = !isEnd && !isSunday;
                            
                            return (
                                <div 
                                    key={booking._id} 
                                    className={`
                                      text-[10px] py-0.5 px-1.5 truncate font-medium cursor-pointer transition-all border-y h-5
                                      ${colors.bg} ${colors.border} ${colors.text}
                                      ${continuesLeft ? 'border-l-0 rounded-l-none ml-[-0.6rem] pl-2 w-[calc(100%+0.7rem)] z-0' : 'border-l rounded-l-md z-10 relative'}
                                      ${continuesRight ? 'border-r-0 rounded-r-none mr-[-0.6rem] pr-2 w-[calc(100%+0.7rem)]' : 'border-r rounded-r-md'}
                                      hover:brightness-95
                                    `}
                                    title={`${hotel?.name} - ${(booking.user as User)?.fullName}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBooking(booking);
                                    }}
                                >
                                    {(isStart || isMonday) ? hotel?.name : '\u00A0'}
                                </div>
                            )
                        })}
                        
                        {hasMore && (
                            <span className="text-[10px] text-muted-foreground font-medium text-center bg-gray-50 rounded-sm">
                                +{dayBookings.length - 3} đơn khác
                            </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-4 text-xs text-muted-foreground">
             <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div> Confirmed
             </div>
             <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div> Completed
             </div>
             <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></div> Pending Deposit
             </div>
             <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div> Awaiting Approval
             </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Khách sạn</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Đã thanh toán</TableHead>
                      <TableHead>Còn lại</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thanh toán</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking: Booking) => {
                      const user = booking.user as User;
                      const hotel = booking.hotel as Hotel;
                      const paidAmount = (booking.paidFromWallet || 0) + (booking.paidFromBonus || 0);
                      const remainingAmount = booking.totalPrice - paidAmount;

                      return (
                        <TableRow key={booking._id}>
                          <TableCell className="font-medium">
                            {booking._id.slice(-8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user?.fullName}</p>
                              <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{hotel?.name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(booking.checkIn), 'dd/MM/yyyy')}</p>
                              <p className="text-muted-foreground">
                                - {format(new Date(booking.checkOut), 'dd/MM/yyyy')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(booking.totalPrice)}
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatPrice(paidAmount)}
                          </TableCell>
                          <TableCell className="text-orange-600 font-medium">
                            {formatPrice(Math.max(0, remainingAmount))}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusText(booking.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.paymentStatus)}>
                              {getStatusText(booking.paymentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                                {/* Check-in button - only for confirmed bookings without actual check-in */}
                                {booking.status === 'confirmed' && !booking.actualCheckIn && (
                                  <DropdownMenuItem onClick={() => handleCheckIn(booking)}>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Check-in
                                  </DropdownMenuItem>
                                )}
                                {/* Checkout button - only for confirmed bookings with actual check-in */}
                                {booking.status === 'confirmed' && booking.actualCheckIn && (
                                  <DropdownMenuItem onClick={() => fetchBill(booking)}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Checkout & Thanh toán
                                  </DropdownMenuItem>
                                )}
                                {/* Invoice button - for completed bookings */}
                                {booking.status === 'completed' && (
                                  <DropdownMenuItem onClick={() => fetchInvoice(booking._id)}>
                                    <Receipt className="mr-2 h-4 w-4" />
                                    Xem hóa đơn
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setUpdateDialog(booking);
                                    setNewStatus(booking.status);
                                    setNewPaymentStatus(booking.paymentStatus);
                                  }}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Cập nhật trạng thái
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Trang {page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Không có đơn đặt phòng nào
            </div>
          )}
        </>
      )}

      {/* Date Detail Dialog (for calendar) */}
      <Dialog open={!!selectedDateDialog} onOpenChange={() => setSelectedDateDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {selectedDateDialog && format(selectedDateDialog, 'EEEE, dd MMMM yyyy', { locale: vi })}
            </DialogTitle>
          </DialogHeader>

          {selectedDateDialog && getBookingsForDate(selectedDateDialog).length > 0 ? (
            <div className="space-y-3 mt-4">
              {getBookingsForDate(selectedDateDialog).map((booking: Booking) => {
                const hotel = booking.hotel as Hotel;
                const room = booking.room as Room;
                const user = booking.user as User;
                const colors = statusCalendarColors[booking.status] || statusCalendarColors.pending;
                const paidAmount = (booking.paidFromWallet || 0) + (booking.paidFromBonus || 0);
                const remainingAmount = booking.totalPrice - paidAmount;

                return (
                  <div
                    key={booking._id}
                    className={`p-4 rounded-xl border-2 ${colors.border} ${colors.bg} cursor-pointer hover:shadow-md transition-all`}
                    onClick={() => {
                      setSelectedDateDialog(null);
                      setSelectedBooking(booking);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{hotel?.name}</p>
                        <p className="text-sm text-muted-foreground">Phòng: {room?.name}</p>
                        <p className="text-sm text-muted-foreground">Khách: {user?.fullName}</p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(booking.checkIn), 'dd/MM')} - {format(new Date(booking.checkOut), 'dd/MM')}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">{formatPrice(booking.totalPrice)}</div>
                        <div className="text-xs text-green-600">Đã trả: {formatPrice(paidAmount)}</div>
                        {remainingAmount > 0 && (
                            <div className="text-xs text-orange-600 font-bold">Còn: {formatPrice(remainingAmount)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <CalendarDays className="h-12 w-12 opacity-20 mb-3" />
              <p>Không có đơn đặt phòng nào trong ngày này</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBooking(null);
            setDeliveringIndex(null);
            if (openBookingId) {
              searchParams.delete('open');
              setSearchParams(searchParams, { replace: true });
            }
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đặt phòng</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Khách sạn & Phòng */}
              {(selectedBooking.hotel || selectedBooking.room) && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-muted-foreground text-sm mb-2">Khách sạn & Phòng</p>
                  <p className="font-semibold text-foreground">{(selectedBooking.hotel as Hotel)?.name || '—'}</p>
                  {(selectedBooking.hotel as Hotel)?.address != null && (selectedBooking.hotel as Hotel)?.city != null && (
                    <p className="text-sm text-muted-foreground">{(selectedBooking.hotel as Hotel)?.address}, {(selectedBooking.hotel as Hotel)?.city}</p>
                  )}
                  <p className="text-sm mt-1">Phòng: <span className="font-medium">{(selectedBooking.room as Room)?.name || '—'}</span></p>
                  {(selectedBooking.room as Room)?.type && (
                    <p className="text-xs text-muted-foreground">Loại phòng: {(selectedBooking.room as Room)?.type}</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mã đơn</p>
                  <p className="font-medium">{selectedBooking._id.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                    <p className="text-muted-foreground">Trạng thái</p>
                     <Badge className={getStatusColor(selectedBooking.status)}>
                          {getStatusText(selectedBooking.status)}
                    </Badge>
                </div>
                 <div>
                    <p className="text-muted-foreground">Thanh toán</p>
                     <Badge className={getStatusColor(selectedBooking.paymentStatus)}>
                          {getStatusText(selectedBooking.paymentStatus)}
                    </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.checkIn), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.checkOut), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-muted-foreground text-sm">Dịch vụ đi kèm</p>
                  {selectedBooking.services?.some((s: any) => {
                    const requiresConfirmation = typeof s.service === 'object' && s.service && (s.service as Service).requiresConfirmation !== false;
                    return requiresConfirmation && !s.deliveredAt;
                  }) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-7"
                      onClick={() => markAllDeliveredMutation.mutate(selectedBooking._id)}
                      disabled={markAllDeliveredMutation.isPending}
                    >
                      {markAllDeliveredMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                      Xác nhận bàn giao tất cả
                    </Button>
                  )}
                </div>
                {selectedBooking.services && selectedBooking.services.length > 0 ? (
                    <ul className="text-sm space-y-2">
                        {selectedBooking.services.map((s: any, idx) => {
                          const serviceName = typeof s.service === 'object' && s.service ? (s.service as Service).name : 'Dịch vụ';
                          const requiresConfirmation = typeof s.service === 'object' && s.service && (s.service as Service).requiresConfirmation !== false;
                          const deliveredAt = s.deliveredAt;
                          const addedAt = s.addedAt;
                          const isThisDelivering = deliveringIndex === idx;
                          return (
                             <li key={idx} className="border rounded-md p-2 flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                  <span>{serviceName} (x{s.quantity}) - {formatPrice(s.price * s.quantity)}</span>
                                  {requiresConfirmation && (
                                    deliveredAt ? (
                                      <Badge variant="secondary" className="text-xs shrink-0">
                                        Đã bàn giao {format(new Date(deliveredAt), 'dd/MM HH:mm')}
                                      </Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7 shrink-0"
                                        onClick={() => {
                                          setDeliveringIndex(idx);
                                          markDeliveredMutation.mutate({ bookingId: selectedBooking._id, serviceIndex: idx });
                                        }}
                                        disabled={deliveringIndex !== null}
                                      >
                                        {isThisDelivering && markDeliveredMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-0.5" /> : <Check className="h-3 w-3 mr-0.5" />}
                                        Đã bàn giao
                                      </Button>
                                    )
                                  )}
                                </div>
                                {addedAt && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Thêm lúc: {format(new Date(addedAt), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                )}
                             </li>
                          );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm">Không có</p>
                )}
              </div>

              <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Tổng tiền</span>
                    <span className="text-primary">{formatPrice(selectedBooking.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Đã thanh toán (Ví + KM)</span>
                    <span>{formatPrice((selectedBooking.paidFromWallet || 0) + (selectedBooking.paidFromBonus || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-orange-600 font-bold">
                    <span>Cần thanh toán</span>
                    <span>{formatPrice(selectedBooking.totalPrice - ((selectedBooking.paidFromWallet || 0) + (selectedBooking.paidFromBonus || 0)))}</span>
                  </div>
              </div>

              <div className="border-t pt-2">
                <p className="text-muted-foreground text-sm mb-1">Liên hệ</p>
                <p className="font-medium">{selectedBooking.contactInfo.fullName}</p>
                <p className="text-sm">{selectedBooking.contactInfo.email}</p>
                <p className="text-sm">{selectedBooking.contactInfo.phone}</p>
              </div>

              {selectedBooking.proofImage && (
                  <div className="border-t pt-2">
                    <p className="text-muted-foreground text-sm mb-2">Minh chứng thanh toán</p>
                    <img src={selectedBooking.proofImage} alt="Proof" className="w-full rounded border" />
                  </div>
              )}

              {selectedBooking.status === 'awaiting_approval' && (
                  <div className="flex gap-2 pt-4">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove('approve')} disabled={approveMutation.isPending}>
                          {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                          Duyệt thanh toán
                      </Button>
                       <Button className="flex-1" variant="destructive" onClick={() => handleApprove('reject')} disabled={approveMutation.isPending}>
                          {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                          Từ chối
                      </Button>
                  </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trạng thái đơn hàng</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xác nhận (Cũ)</SelectItem>
                  <SelectItem value="pending_deposit">Chờ đặt cọc</SelectItem>
                  <SelectItem value="awaiting_approval">Chờ duyệt</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái thanh toán</Label>
              <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(null)}>
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={!!checkoutDialog} onOpenChange={() => { setCheckoutDialog(null); setBillData(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Checkout & Thanh toán
            </DialogTitle>
          </DialogHeader>
          {billData && (() => {
            const booking = billData.booking as Booking;
            const summary = billData.summary as {
              roomPrice: number;
              servicePrice: number;
              estimatedTotal: number;
              nights: number;
              userWalletBalance: number;
              userBonusBalance: number;
              paidFromWallet?: number;
              paidFromBonus?: number;
              totalPaid?: number;
              amountDue?: number;
            };
            const totalPaid = summary.totalPaid ?? (summary.paidFromWallet ?? 0) + (summary.paidFromBonus ?? 0);
            const amountDue = summary.amountDue ?? Math.max(0, summary.estimatedTotal - totalPaid);
            const hotel = booking.hotel as Hotel;
            const room = booking.room as Room;
            return (
            <div className="space-y-4">
              {/* Thông tin đơn hàng */}
              <div className="border rounded-lg p-3 space-y-1.5 text-sm">
                <p className="font-medium text-foreground">Thông tin đơn hàng</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã đơn:</span>
                  <span className="font-mono">{booking._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khách hàng:</span>
                  <span>{booking.contactInfo?.fullName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khách sạn:</span>
                  <span>{hotel?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phòng:</span>
                  <span>{room?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in:</span>
                  <span>{booking.checkIn ? format(new Date(booking.checkIn), 'dd/MM/yyyy') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out:</span>
                  <span>{booking.checkOut ? format(new Date(booking.checkOut), 'dd/MM/yyyy') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số đêm:</span>
                  <span>{billData.summary.nights} đêm</span>
                </div>
              </div>

              {/* Chi tiết hóa đơn */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="font-medium text-foreground">Chi tiết thanh toán</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiền phòng ({billData.summary.nights} đêm):</span>
                  <span className="font-medium">{formatPrice(billData.summary.roomPrice)}</span>
                </div>
                {booking.services && booking.services.length > 0 && (
                  <>
                    <p className="text-muted-foreground text-sm mt-2">Dịch vụ:</p>
                    {booking.services.map((s: any, idx: number) => {
                      const name = typeof s.service === 'object' && s.service ? (s.service as Service).name : 'Dịch vụ';
                      const subtotal = (s.price || 0) * (s.quantity || 1);
                      return (
                        <div key={idx} className="flex justify-between text-sm pl-2 border-l-2 border-gray-200">
                          <span>{name} x{s.quantity}</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-sm font-medium pt-0.5">
                      <span className="text-muted-foreground">Tổng dịch vụ:</span>
                      <span>{formatPrice(billData.summary.servicePrice)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-1">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{formatPrice(summary.estimatedTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 border-t pt-2 mt-1">
                  <span>Tiền đã cọc / đã thanh toán:</span>
                  <span className="font-medium">{formatPrice(totalPaid)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="pl-2 text-xs text-muted-foreground space-y-0.5">
                    {(summary.paidFromWallet ?? booking.paidFromWallet) ? (
                      <div className="flex justify-between">
                        <span>Trong đó từ ví:</span>
                        <span>{formatPrice(summary.paidFromWallet ?? booking.paidFromWallet ?? 0)}</span>
                      </div>
                    ) : null}
                    {(summary.paidFromBonus ?? booking.paidFromBonus) ? (
                      <div className="flex justify-between">
                        <span>Trong đó từ khuyến mãi:</span>
                        <span>{formatPrice(summary.paidFromBonus ?? booking.paidFromBonus ?? 0)}</span>
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-primary border-t pt-2 mt-1">
                  <span>Số tiền cần thanh toán:</span>
                  <span>{formatPrice(amountDue)}</span>
                </div>
              </div>

              {/* Số dư ví khách hàng */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="font-medium text-blue-900">Số dư ví khách hàng</p>
                <div className="flex justify-between text-sm">
                  <span>Số dư chính:</span>
                  <span className="font-bold">{formatPrice(billData.summary.userWalletBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tiền khuyến mãi:</span>
                  <span className="font-bold text-amber-600">{formatPrice(billData.summary.userBonusBalance)}</span>
                </div>
              </div>

              {/* Payment Option */}
              <div className="space-y-2">
                <Label>Chọn cách thanh toán</Label>
                <Select value={paymentOption} onValueChange={(v) => setPaymentOption(v as PaymentOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="use_bonus">Dùng tiền khuyến mãi trước</SelectItem>
                    <SelectItem value="use_main_only">Chỉ dùng số dư chính</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkout Note */}
              <div className="space-y-2">
                <Label>Ghi chú (không bắt buộc)</Label>
                <Input
                  placeholder="Nhập ghi chú checkout..."
                  value={checkoutNote}
                  onChange={(e) => setCheckoutNote(e.target.value)}
                />
              </div>

              {/* Warning if insufficient balance */}
              {amountDue > 0 && amountDue > billData.summary.userWalletBalance + billData.summary.userBonusBalance && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-700 text-sm">
                  ⚠️ Số dư ví không đủ để thanh toán. Khách sẽ cần thanh toán thêm bằng tiền mặt hoặc hình thức khác.
                </div>
              )}
            </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCheckoutDialog(null); setBillData(null); }}>
              Hủy
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {checkoutMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Xác nhận Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={!!invoiceData} onOpenChange={() => setInvoiceData(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Hóa đơn
            </DialogTitle>
          </DialogHeader>
          {invoiceData && (
            <>
              <div ref={invoicePrintRef}>
                <InvoicePrint invoice={invoiceData} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInvoiceData(null)}>
                  Đóng
                </Button>
                <Button onClick={() => handlePrint()}>
                  <Printer className="mr-2 h-4 w-4" />
                  In hóa đơn
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}