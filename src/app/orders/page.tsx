'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, FileText, MapPin, Pencil, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDisplayCodTotal, getDisplayProductTotal } from '@/lib/order-display';
import { formatPrice } from '@/lib/utils';

type OrderItem = {
  id: string;
  quantity: number;
  basePrice: number;
  salePrice: number;
  product: { name: string };
};

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  shippingFee: number;
  hasDeposit: boolean;
  depositAmount: number | null;
  receiptImage: string | null;
  status: string;
  trackingCode: string | null;
  createdAt: string;
  orderItems: OrderItem[];
};

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [billOrder, setBillOrder] = useState<Order | null>(null);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const formatCurrency = useCallback((amt: number) => `${formatPrice(amt)}\u00A0đ`, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) setOrders(await res.json());
    } catch {
      toast.error('Lỗi tải danh sách đơn hàng');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOrders();
  }, []);

  const calculateProductTotal = useCallback((order: Order) => getDisplayProductTotal(order.orderItems), []);
  const calculateCodTotal = useCallback((order: Order) => getDisplayCodTotal({ items: order.orderItems, depositAmount: order.depositAmount }), []);
  const calculateProfit = useCallback((order: Order) => order.orderItems.reduce((acc, item) => acc + (item.salePrice - item.basePrice) * item.quantity, 0), []);
  const calculateCost = useCallback((order: Order) => order.orderItems.reduce((acc, item) => acc + item.basePrice * item.quantity, 0), []);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesDate = !dateFilter || new Date(order.createdAt).toISOString().split('T')[0] === dateFilter;
    return matchesStatus && matchesDate;
  }), [orders, statusFilter, dateFilter]);

  const toggleExpand = useCallback((orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  const handleCopy = useCallback((text: string, message = 'Đã sao chép') => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  }, []);

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này? Thao tác này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa đơn hàng thành công');
        fetchOrders();
      } else {
        toast.error('Gặp lỗi khi xóa đơn hàng');
      }
    } catch {
      toast.error('Lỗi khi xóa đơn hàng');
    }
  };

  const handleOpenUpdate = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingCode(order.trackingCode || '');
    setConfirmPayment(false);
    setIsUpdateOpen(true);
  };

  const submitStatusUpdate = async () => {
    if (!selectedOrder) return;
    if (newStatus === 'SHIPPING' && !trackingCode) return toast.error('Vui lòng nhập mã vận đơn khi trạng thái là Đang vận chuyển');
    if (newStatus === 'DONE' && !confirmPayment) return toast.error('Vui lòng xác nhận khách đã thanh toán đầy đủ');
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, trackingCode }),
      });
      if (res.ok) {
        toast.success('Cập nhật trạng thái thành công');
        setIsUpdateOpen(false);
        fetchOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const handlePrintBill = useCallback(() => {
    if (!billOrder) return;
    router.push(`/orders/${billOrder.id}/invoice`);
  }, [billOrder, router]);

  const getStatusText = (status: string) => status === 'WAITING_FOR_GOODS' ? 'Đợi hàng về' : status === 'SHIPPING' ? 'Đang vận chuyển' : status === 'DONE' ? 'Đã xong' : status;
  const getStatusStyles = (status: string) => status === 'WAITING_FOR_GOODS' ? 'border-amber-200/80 bg-amber-50 text-amber-700' : status === 'SHIPPING' ? 'border-sky-200/80 bg-sky-50 text-sky-700' : status === 'DONE' ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700' : 'border-slate-200/80 bg-slate-50 text-slate-700';

  const renderMeta = (order: Order) => (
    <div>
      <div className="font-medium text-foreground">{order.customerName}</div>
      {order.customerPhone ? (
        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <button onClick={() => handleCopy(order.customerPhone || '', 'Đã sao chép số điện thoại')} className="rounded-xl border border-border/60 bg-white/80 p-1.5 text-slate-400 transition-colors hover:text-primary" title="Sao chép số điện thoại">
            <Copy className="h-3 w-3" />
          </button>
          <span>{order.customerPhone}</span>
        </div>
      ) : null}
      {order.customerAddress ? (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600">
          <button onClick={() => handleCopy(order.customerAddress || '', 'Đã sao chép địa chỉ')} className="shrink-0 rounded-xl border border-border/60 bg-white/80 p-1.5 text-slate-400 transition-colors hover:text-primary" title="Sao chép địa chỉ">
            <Copy className="h-3 w-3" />
          </button>
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span className="leading-relaxed">{order.customerAddress}</span>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex justify-end">
        <Link href="/orders/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Thêm đơn mới</Button>
        </Link>
      </div>

      <section className="surface-panel grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lọc theo trạng thái</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem><SelectItem value="WAITING_FOR_GOODS">Đợi hàng về</SelectItem><SelectItem value="SHIPPING">Đang vận chuyển</SelectItem><SelectItem value="DONE">Đã xong</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lọc theo ngày</Label>
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <Button variant="outline" className="w-full text-xs md:w-auto" onClick={() => { setStatusFilter('ALL'); setDateFilter(''); }}>Xóa lọc</Button>
      </section>

      <div className="surface-panel hidden overflow-hidden p-0 md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Khách hàng</TableHead><TableHead>Tổng tiền hàng</TableHead><TableHead>Trạng thái</TableHead><TableHead>Cọc / hóa đơn</TableHead><TableHead>Hành động</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center">Không tìm thấy đơn hàng nào</TableCell></TableRow> : filteredOrders.map((order) => (
              <TableRow key={order.id} className="border-border/60">
                <TableCell className="align-top">{renderMeta(order)}</TableCell>
                <TableCell className="whitespace-nowrap"><div className="flex items-center gap-2 font-medium text-primary">{formatCurrency(calculateProductTotal(order))}<button onClick={() => toggleExpand(order.id)} className="rounded-xl border border-border/60 bg-white/80 p-1.5 text-slate-400 transition-colors hover:text-foreground"><Chevron expanded={expandedOrders.has(order.id)} /></button></div><div className="mt-1 text-[11px] text-slate-500">Ship: {formatCurrency(order.shippingFee)}</div></TableCell>
                <TableCell><span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(order.status)}`}>{getStatusText(order.status)}</span>{order.trackingCode ? <div className="mt-1 text-xs text-muted-foreground">Mã: {order.trackingCode}</div> : null}</TableCell>
                <TableCell>{order.hasDeposit ? <div className="text-sm"><div className="font-medium text-primary">Đã cọc: {formatCurrency(order.depositAmount || 0)}</div>{order.receiptImage ? <Button variant="ghost" size="sm" onClick={() => { setReceiptUrl(order.receiptImage); setReceiptDialogOpen(true); }}>Xem biên lai</Button> : <span className="text-xs text-slate-400">Không có ảnh</span>}</div> : <span className="text-sm text-gray-500">Chưa cọc</span>}</TableCell>
                <TableCell><div className="flex flex-wrap items-center gap-2"><Link href={`/orders/${order.id}/edit`}><Button variant="outline" size="sm" className="gap-1"><Pencil className="h-3 w-3" />Sửa</Button></Link><Button variant="outline" size="sm" onClick={() => handleOpenUpdate(order)}>Trạng thái</Button><Button variant="outline" size="sm" className="gap-1" onClick={() => { setBillOrder(order); setIsBillOpen(true); }}><FileText className="h-3 w-3" />Hóa đơn</Button><button onClick={() => handleDeleteOrder(order.id)} className="rounded-xl border border-border/70 p-2 text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500" title="Xóa đơn hàng"><Trash2 className="h-4 w-4" /></button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4 md:hidden">
        {filteredOrders.length === 0 ? <div className="surface-panel p-8 text-center text-gray-500">Không tìm thấy đơn hàng nào</div> : filteredOrders.map((order) => (
          <article key={order.id} className="surface-panel space-y-4 p-4">
            <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
              {renderMeta(order)}
              <div className="min-w-[7.5rem] text-right">
                <div className="flex items-center justify-end gap-1"><div className="text-lg font-bold text-primary">{formatCurrency(calculateProductTotal(order))}</div><button onClick={() => toggleExpand(order.id)} className="rounded-xl border border-border/60 bg-white/80 p-1.5 text-slate-400 transition-colors hover:text-foreground"><Chevron expanded={expandedOrders.has(order.id)} /></button></div>
                <div className="mt-1 text-[11px] text-slate-500">Ship: {formatCurrency(order.shippingFee)}</div>
                <div className="mt-2"><span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold ${getStatusStyles(order.status)}`}>{getStatusText(order.status)}</span></div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,241,245,0.88))] px-4 py-3"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tiền COD</p><p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-primary">{formatCurrency(calculateCodTotal(order))}</p></div>
              <div className="rounded-[1.35rem] border border-border/70 bg-secondary/55 px-4 py-3"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Đặt cọc</p><p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-foreground">{formatCurrency(order.depositAmount || 0)}</p><p className="mt-1 text-xs text-muted-foreground">{order.hasDeposit ? 'Đơn đã có cọc' : 'Đơn chưa ghi nhận cọc'}</p></div>
            </div>

            {order.trackingCode ? <div className="rounded-[1.25rem] border border-border/70 bg-white/80 px-3 py-3 text-xs font-medium text-primary">Vận đơn: {order.trackingCode}</div> : null}

            <div className="grid grid-cols-[auto_1fr_1fr] gap-2 border-t border-border/60 pt-3"><button onClick={() => handleDeleteOrder(order.id)} className="rounded-2xl border border-border/70 p-2.5 text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500" title="Xóa đơn"><Trash2 className="h-4 w-4" /></button><Link href={`/orders/${order.id}/edit`}><Button variant="outline" size="sm" className="w-full gap-1 text-xs"><Pencil className="h-4 w-4" />Sửa</Button></Link><Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => { setBillOrder(order); setIsBillOpen(true); }}><FileText className="h-4 w-4" />Hóa đơn</Button></div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenUpdate(order)}>Cập nhật trạng thái</Button>

            {expandedOrders.has(order.id) ? <div className="space-y-3 border-t border-border/60 pt-4 text-sm"><div className="space-y-2 rounded-[1.35rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,249,250,0.72),rgba(255,255,255,0.96))] p-3">{order.orderItems.map((item) => <div key={item.id} className="flex justify-between border-b border-border/50 pb-2 text-gray-700 last:border-0 last:pb-0"><span>{item.quantity}x {item.product.name}</span><span>{formatCurrency(item.salePrice * item.quantity)}</span></div>)}</div><div className="flex justify-between px-1 text-gray-600"><span>Tổng tiền hàng:</span><span>{formatCurrency(calculateProductTotal(order))}</span></div><div className="flex justify-between px-1 text-xs text-slate-500"><span>Phí vận chuyển:</span><span>{formatCurrency(order.shippingFee)}</span></div><div className="flex justify-between px-1 text-sky-700"><span>Tiền lấy hàng:</span><span>{formatCurrency(calculateCost(order))}</span></div><div className="flex justify-between px-1 font-bold text-primary"><span>Tiền lời:</span><span>{formatCurrency(calculateProfit(order))}</span></div></div> : null}
          </article>
        ))}
      </div>

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="z-[100] flex h-screen w-screen max-w-none items-center justify-center border-none bg-black/90 p-0">
          {receiptUrl ? <div className="relative flex h-full w-full items-center justify-center p-4"><Image src={receiptUrl} alt="Biên lai thanh toán" fill className="object-contain" priority /></div> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent><DialogHeader><DialogTitle>Cập nhật đơn hàng</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label>Trạng thái</Label><Select value={newStatus} onValueChange={setNewStatus}><SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger><SelectContent><SelectItem value="WAITING_FOR_GOODS">Đợi hàng về</SelectItem><SelectItem value="SHIPPING">Đang vận chuyển</SelectItem><SelectItem value="DONE">Đã xong</SelectItem></SelectContent></Select></div>{newStatus === 'DONE' ? <div className="rounded-[1.2rem] border border-rose-100 bg-rose-50 p-3 text-sm text-rose-900">Nếu chuyển trạng thái sang &quot;Đã xong&quot;, ảnh hóa đơn cọc sẽ bị xóa khỏi hệ thống để tiết kiệm dung lượng.</div> : null}{newStatus === 'SHIPPING' ? <div className="space-y-2"><Label>Mã vận đơn *</Label><Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Nhập mã vận đơn GHTK / ViettelPost..." /></div> : null}{newStatus === 'DONE' ? <div className="flex items-start space-x-3 rounded-[1.2rem] border border-emerald-100 bg-emerald-50 p-3"><input type="checkbox" id="confirm-payment" className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" checked={confirmPayment} onChange={(e) => setConfirmPayment(e.target.checked)} /><label htmlFor="confirm-payment" className="cursor-pointer text-sm font-medium text-emerald-900">Tôi xác nhận khách hàng đã thanh toán đầy đủ số tiền còn lại của đơn hàng này.</label></div> : null}<div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setIsUpdateOpen(false)}>Hủy</Button><Button onClick={submitStatusUpdate}>Lưu thay đổi</Button></div></div></DialogContent>
      </Dialog>

      <Dialog open={isBillOpen} onOpenChange={setIsBillOpen}>
        <DialogContent className="invoice-print-shell max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader className="invoice-print-header"><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Hóa đơn bán hàng</DialogTitle></DialogHeader>
          {billOrder ? <div id="bill-content" className="invoice-print-card space-y-6 rounded-[1.75rem] border border-border/70 bg-white p-6 text-slate-800"><div className="border-b border-border/70 pb-4 text-center"><h2 className="text-2xl font-bold uppercase tracking-wider">Hóa đơn thanh toán</h2><p className="mt-1 text-sm text-slate-500">{new Date(billOrder.createdAt).toLocaleDateString('vi-VN')}</p></div><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Khách hàng</p><p className="text-base font-semibold">{billOrder.customerName}</p>{billOrder.customerPhone ? <p>{billOrder.customerPhone}</p> : null}{billOrder.customerAddress ? <p className="mt-1 text-xs italic text-slate-500">{billOrder.customerAddress}</p> : null}</div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cửa hàng</p><p className="font-semibold">Rim Cưng Cosmetics</p><p className="text-xs text-slate-500">Hỗ trợ nhanh: 0333586853</p></div></div><div className="overflow-hidden rounded-[1.35rem] border border-border/70"><table className="w-full text-sm"><thead className="border-b bg-slate-50"><tr className="text-[11px] uppercase tracking-tight"><th className="px-2 py-1 text-left">Sản phẩm</th><th className="w-10 px-2 py-1 text-center">SL</th><th className="px-2 py-1 text-right">Đơn giá</th><th className="px-2 py-1 text-right">Thành tiền</th></tr></thead><tbody className="text-[12px]">{billOrder.orderItems.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-2 py-1 font-medium leading-tight">{item.product.name}</td><td className="px-2 py-1 text-center">{item.quantity}</td><td className="px-2 py-1 text-right">{formatCurrency(item.salePrice)}</td><td className="px-2 py-1 text-right font-semibold">{formatCurrency(item.salePrice * item.quantity)}</td></tr>)}</tbody></table></div><div className="space-y-1 border-t pt-1.5 text-[12px]"><div className="flex justify-between"><span className="text-slate-500">Tổng tiền hàng:</span><span>{formatCurrency(calculateProductTotal(billOrder))}</span></div><div className="flex justify-between text-[11px] text-slate-500"><span>Phí vận chuyển:</span><span>{formatCurrency(billOrder.shippingFee)}</span></div><div className="mt-1.5 flex justify-between border-t pt-1.5 text-base font-bold"><span>Tổng tiền hàng:</span><span className="text-primary">{formatCurrency(calculateProductTotal(billOrder))}</span></div>{billOrder.hasDeposit ? <div className="flex justify-between text-emerald-600"><span>Đã đặt cọc:</span><span>- {formatCurrency(billOrder.depositAmount || 0)}</span></div> : null}<div className="mt-1 flex justify-between rounded-[1rem] bg-rose-50 p-1.5 text-sm font-bold"><span>Tiền COD:</span><span className="text-rose-700">{formatCurrency(calculateCodTotal(billOrder))}</span></div></div></div> : null}
          <div className="invoice-print-actions flex justify-end gap-3 border-t pt-4"><Button variant="outline" onClick={() => setIsBillOpen(false)}>Đóng</Button><Button className="gap-2" onClick={handlePrintBill}><Printer className="h-4 w-4" />In hóa đơn</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
