import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Wallet, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils';
import { walletService } from '@/services/walletService';
import type { User as UserType, WalletTransaction } from '@/types';

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const transactionTypeLabels: Record<string, string> = {
  deposit: 'Nạp tiền',
  withdrawal: 'Hoàn tiền',
  payment: 'Thanh toán',
  refund: 'Hoàn tiền',
  bonus: 'Khuyến mãi',
};

export default function WalletsManagePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [txPage, setTxPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsersWallet', search, page],
    queryFn: () => walletService.getAllUsersWallet({ search, page, limit: 10 }),
  });

  const { data: userDetailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['adminUserWalletDetails', selectedUser?._id, txPage],
    queryFn: () => walletService.getUserWalletDetails(selectedUser!._id, { page: txPage, limit: 10 }),
    enabled: !!selectedUser,
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  const userDetails = userDetailsData?.data;
  const txPagination = userDetailsData?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý ví người dùng</h1>
        <p className="text-muted-foreground">Xem số dư và lịch sử giao dịch của khách hàng</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Không tìm thấy người dùng</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Số dư chính</TableHead>
                    <TableHead>Tiền khuyến mãi</TableHead>
                    <TableHead>Tổng số dư</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: UserType) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(user.walletBalance || 0)}</TableCell>
                      <TableCell className="text-amber-600">{formatPrice(user.bonusBalance || 0)}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatPrice((user.walletBalance || 0) + (user.bonusBalance || 0))}
                      </TableCell>
                      <TableCell>
                        <Badge className={user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {user.isActive ? 'Hoạt động' : 'Khóa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setTxPage(1);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Trước
                  </Button>
                  <span className="px-4 py-2 text-sm">Trang {page} / {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Chi tiết ví
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedUser.fullName}</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-muted-foreground">{selectedUser.phone}</p>
                </div>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Số dư chính</p>
                    <p className="text-xl font-bold">{formatPrice(userDetails?.user?.walletBalance || 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Tiền khuyến mãi</p>
                    <p className="text-xl font-bold text-amber-600">{formatPrice(userDetails?.user?.bonusBalance || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Tổng cộng</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatPrice((userDetails?.user?.walletBalance || 0) + (userDetails?.user?.bonusBalance || 0))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions */}
              <div>
                <h3 className="font-semibold mb-3">Lịch sử giao dịch</h3>
                {detailsLoading ? (
                  <div className="text-center py-4">Đang tải...</div>
                ) : !userDetails?.transactions?.length ? (
                  <div className="text-center py-4 text-muted-foreground">Chưa có giao dịch</div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {userDetails.transactions.map((tx: WalletTransaction) => {
                        const isPositive = ['deposit', 'refund', 'bonus'].includes(tx.type);
                        return (
                          <div key={tx._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{transactionTypeLabels[tx.type]}</p>
                              <p className="text-sm text-muted-foreground">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : '-'}{formatPrice(tx.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">Sau: {formatPrice(tx.balanceAfter)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {txPagination && txPagination.totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button variant="outline" size="sm" disabled={txPage === 1} onClick={() => setTxPage(txPage - 1)}>
                          Trước
                        </Button>
                        <span className="px-4 py-2 text-sm">Trang {txPage} / {txPagination.totalPages}</span>
                        <Button variant="outline" size="sm" disabled={txPage === txPagination.totalPages} onClick={() => setTxPage(txPage + 1)}>
                          Sau
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
