import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star, Check, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { reviewService } from '@/services/reviewService';
import type { Review, User, Hotel } from '@/types';

export default function ReviewsManagePage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteReview, setDeleteReview] = useState<Review | null>(null);
  const [approveReview, setApproveReview] = useState<{ review: Review; isApproved: boolean } | null>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['adminReviews', filter, page, limit],
    queryFn: () => reviewService.getAllReviews({ 
        page,
        limit,
        isApproved: filter === 'all' ? undefined : filter === 'approved' 
    }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) => 
        reviewService.approveReview(id, isApproved),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      setApproveReview(null);
      toast({ 
        title: 'Thành công', 
        description: variables.isApproved ? 'Đã duyệt đánh giá' : 'Đã hủy duyệt đánh giá' 
      });
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể xử lý đánh giá', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reviewService.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      setDeleteReview(null);
      toast({ title: 'Thành công', description: 'Đã xóa đánh giá' });
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể xóa đánh giá', variant: 'destructive' });
    },
  });

  const reviews = data?.data || [];
  const pagination = data?.pagination;

  const handleConfirmDelete = () => {
    if (deleteReview) {
      deleteMutation.mutate(deleteReview._id);
    }
  };

  const handleConfirmApprove = () => {
    if (approveReview) {
      approveMutation.mutate({ id: approveReview.review._id, isApproved: approveReview.isApproved });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
          <p className="text-muted-foreground">Tổng số: {pagination?.total || 0}</p>
        </div>
        <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => { setFilter('all'); setPage(1); }}>Tất cả</Button>
            <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => { setFilter('pending'); setPage(1); }}>Chờ duyệt</Button>
            <Button variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => { setFilter('approved'); setPage(1); }}>Đã duyệt</Button>
        </div>
      </div>

      <div className="flex justify-end items-center gap-2">
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
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">mục</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Khách sạn</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không có đánh giá nào
                    </TableCell>
                  </TableRow>
                ) : reviews.map((review: Review) => {
                    const user = review.user as User;
                    const hotel = review.hotel as any;
                    return (
                      <TableRow key={review._id}>
                      <TableCell>
                          <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback>{user?.fullName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium">{user?.fullName}</div>
                          </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                          {hotel?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center text-yellow-500">
                              {review.rating} <Star className="ml-1 h-3 w-3 fill-current" />
                          </div>
                      </TableCell>
                      <TableCell>
                          <p className="text-sm text-gray-600 max-w-md truncate">{review.comment}</p>
                      </TableCell>
                      <TableCell>
                          <Badge variant={review.isApproved ? 'secondary' : 'destructive'} className={review.isApproved ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
                              {review.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                          </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex gap-2">
                              {!review.isApproved && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-green-600" 
                                    onClick={() => setApproveReview({ review, isApproved: true })}
                                  >
                                      <Check className="h-4 w-4" />
                                  </Button>
                              )}
                              {review.isApproved && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-orange-600" 
                                    onClick={() => setApproveReview({ review, isApproved: false })}
                                  >
                                      <X className="h-4 w-4" />
                                  </Button>
                              )}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-red-600" 
                                onClick={() => setDeleteReview(review)}
                              >
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
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
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReview} onOpenChange={() => setDeleteReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve/Unapprove Confirmation Dialog */}
      <AlertDialog open={!!approveReview} onOpenChange={() => setApproveReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approveReview?.isApproved ? 'Xác nhận duyệt?' : 'Xác nhận hủy duyệt?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approveReview?.isApproved 
                ? 'Đánh giá này sẽ được hiển thị công khai.' 
                : 'Đánh giá này sẽ bị ẩn khỏi công khai.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApprove}
              className={approveReview?.isApproved ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approveReview?.isApproved ? 'Duyệt' : 'Hủy duyệt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
