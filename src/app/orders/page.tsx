'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import { MapPin, Trash2, Pencil, Copy } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type OrderItem = {
    id: string;
    quantity: number;
    price: number;
    product: {
        name: string;
    };
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

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [trackingCode, setTrackingCode] = useState<string>('');
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [confirmPayment, setConfirmPayment] = useState(false);

    // Filtering states
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD

    // Receipt image dialog state
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch {
            toast.error('Lỗi tải danh sách đơn hàng');
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchOrders();
    }, []);

    const handleOpenUpdate = (order: Order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setTrackingCode(order.trackingCode || '');
        setConfirmPayment(false);
        setIsUpdateOpen(true);
    };

    const submitStatusUpdate = async () => {
        if (!selectedOrder) return;

        if (newStatus === 'SHIPPING' && !trackingCode) {
            toast.error('Vui lòng nhập mã vận đơn khi trạng thái là Đang vận chuyển');
            return;
        }

        if (newStatus === 'DONE' && !confirmPayment) {
            toast.error('Vui lòng xác nhận khách đã thanh toán đầy đủ');
            return;
        }

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

    const formatCurrency = (amt: number) => `${formatPrice(amt)} đ`;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'WAITING_FOR_GOODS':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'SHIPPING':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'DONE':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'WAITING_FOR_GOODS':
                return 'Đợi hàng về';
            case 'SHIPPING':
                return 'Đang vận chuyển';
            case 'DONE':
                return 'Đã xong';
            default:
                return status;
        }
    };

    const calculateTotal = (order: Order) => {
        const itemsTotal = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return itemsTotal + order.shippingFee;
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

        let matchesDate = true;
        if (dateFilter) {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            matchesDate = orderDate === dateFilter;
        }

        return matchesStatus && matchesDate;
    });

    const toggleExpand = (orderId: string) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const handleDeleteOrder = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này? Thao tác này không thể hoàn tác.')) return;

        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'DELETE',
            });

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

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã sao chép mã vận đơn');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Đơn Hàng</h1>
                <Link href="/orders/new">
                    <Button>Thêm Đơn Mới</Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex-1 space-y-1">
                    <Label className="text-xs text-slate-500">Lọc theo trạng thái</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                            <SelectItem value="WAITING_FOR_GOODS">Đợi hàng về</SelectItem>
                            <SelectItem value="SHIPPING">Đang vận chuyển</SelectItem>
                            <SelectItem value="DONE">Đã xong</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 space-y-1">
                    <Label className="text-xs text-slate-500">Lọc theo ngày</Label>
                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full"
                    />
                </div>
                <div className="flex items-end">
                    <Button
                        variant="ghost"
                        onClick={() => { setStatusFilter('ALL'); setDateFilter(''); }}
                        className="text-slate-500 text-xs h-10"
                    >
                        Xóa lọc
                    </Button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Khách Hàng</TableHead>
                            <TableHead>Tổng tiền (chưa trừ cọc)</TableHead>
                            <TableHead>Trạng Thái</TableHead>
                            <TableHead>Cọc / Hóa Đơn</TableHead>
                            <TableHead>Hành Động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Không tìm thấy đơn hàng nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => (
                                <React.Fragment key={order.id}>
                                    <TableRow>
                                        <TableCell className="align-top">
                                            <div className="font-medium">{order.customerName}</div>
                                            <div className="text-sm text-gray-500">{order.customerPhone}</div>
                                            {order.customerAddress && (
                                                <div className="text-xs text-slate-600 mt-1.5 flex items-start gap-1">
                                                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                                                    <span className="leading-relaxed">{order.customerAddress}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-rose-600">
                                            <div className="flex items-center gap-2">
                                                {formatCurrency(calculateTotal(order))}
                                                <button
                                                    onClick={() => toggleExpand(order.id)}
                                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                                                >
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
                                                        className={`transition-transform duration-200 ${expandedOrders.has(order.id) ? 'rotate-180' : ''}`}
                                                    >
                                                        <polyline points="6 9 12 15 18 9"></polyline>
                                                    </svg>
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusStyles(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                            {order.trackingCode && (
                                                <div className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
                                                    <span>Mã: {order.trackingCode}</span>
                                                    <button
                                                        onClick={() => handleCopy(order.trackingCode!)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-rose-500 transition-colors"
                                                        title="Sao chép"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {order.hasDeposit ? (
                                                <div className="text-sm">
                                                    <div className="text-rose-600 font-medium">Đã cọc: {formatCurrency(order.depositAmount || 0)}</div>
                                                    {order.receiptImage ? (
                                                        <Button variant="ghost" size="sm" onClick={() => { setReceiptUrl(order.receiptImage); setReceiptDialogOpen(true); }}>
                                                            Xem biên lai
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Không có ảnh</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">Chưa cọc</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/orders/${order.id}/edit`}>
                                                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                                                        <Pencil className="w-3 h-3" />
                                                        Sửa
                                                    </Button>
                                                </Link>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenUpdate(order)}>
                                                    Trạng thái
                                                </Button>
                                                <button
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors border rounded-md hover:border-red-100 hover:bg-red-50"
                                                    title="Xóa đơn hàng"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {
                                        expandedOrders.has(order.id) && (
                                            <TableRow className="bg-slate-50/50">
                                                <TableCell colSpan={5} className="p-0">
                                                    <div className="p-4 pl-16 grid grid-cols-2 gap-8 text-sm border-t">
                                                        <div>
                                                            <div className="font-medium text-gray-500 mb-2">Chi tiết sản phẩm</div>
                                                            <div className="space-y-2">
                                                                {order.orderItems.map((item) => (
                                                                    <div key={item.id} className="flex justify-between items-center border-b pb-1 last:border-0 last:pb-0 border-slate-100">
                                                                        <span className="text-gray-700">{item.quantity}x {item.product.name}</span>
                                                                        <span className="text-gray-600">{formatCurrency(item.price * item.quantity)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-500 mb-2">Thanh toán</div>
                                                            <div className="space-y-1 text-gray-600">
                                                                <div className="flex justify-between">
                                                                    <span>Tổng tiền hàng:</span>
                                                                    <span>{formatCurrency(calculateTotal(order) - order.shippingFee)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Phí ship:</span>
                                                                    <span>{formatCurrency(order.shippingFee)}</span>
                                                                </div>
                                                                <div className="flex justify-between font-medium text-emerald-600 pt-1 border-t border-slate-200 mt-1">
                                                                    <span>Cần Thu:</span>
                                                                    <span>{formatCurrency(Math.max(0, calculateTotal(order) - (order.depositAmount || 0)))}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-lg border text-gray-500">
                        Không tìm thấy đơn hàng nào
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                            <div className="flex justify-between items-start border-b pb-3">
                                <div>
                                    <div className="font-medium text-lg">{order.customerName}</div>
                                    <div className="text-sm text-gray-500">{order.customerPhone}</div>
                                    {order.customerAddress && (
                                        <div className="text-xs text-slate-600 mt-1.5 flex items-start gap-1">
                                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                                            <span className="leading-relaxed">{order.customerAddress}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <div className="font-bold text-rose-600">{formatCurrency(calculateTotal(order))}</div>
                                        <button
                                            onClick={() => toggleExpand(order.id)}
                                            className="text-gray-400 p-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${expandedOrders.has(order.id) ? 'rotate-180' : ''}`}>
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getStatusStyles(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="text-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-gray-500">Trạng thái cọc: </span>
                                        {order.hasDeposit ? (
                                            <span className="text-rose-600 font-medium">
                                                Đã cọc {formatCurrency(order.depositAmount || 0)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 uppercase text-[10px] font-bold tracking-wider">Chưa cọc</span>
                                        )}
                                    </div>
                                    {order.hasDeposit && order.receiptImage && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-0 h-auto"
                                            onClick={() => { setReceiptUrl(order.receiptImage); setReceiptDialogOpen(true); }}
                                        >
                                            Xem biên lai
                                        </Button>
                                    )}
                                </div>

                                {order.trackingCode && (
                                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-between gap-3">
                                        <div className="text-xs font-medium text-rose-600 break-all">
                                            Vận đơn: {order.trackingCode}
                                        </div>
                                        <button
                                            onClick={() => handleCopy(order.trackingCode!)}
                                            className="shrink-0 p-1.5 bg-white border rounded shadow-sm hover:text-rose-500 transition-colors"
                                            title="Sao chép"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-2 items-center justify-end pt-2 border-t border-slate-50">
                                    <button
                                        onClick={() => handleDeleteOrder(order.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors border rounded-md"
                                        title="Xóa đơn"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <Link href={`/orders/${order.id}/edit`}>
                                        <Button variant="outline" size="sm" className="h-9 text-xs px-3 flex items-center gap-1">
                                            <Pencil className="w-4 h-4" />
                                            Sửa
                                        </Button>
                                    </Link>
                                    <Button variant="outline" size="sm" className="h-9 text-xs px-3" onClick={() => handleOpenUpdate(order)}>
                                        Trạng thái
                                    </Button>
                                </div>
                            </div>

                            {expandedOrders.has(order.id) && (
                                <div className="pt-3 border-t border-slate-100 flex flex-col gap-3 text-sm">
                                    <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-2">
                                        <div className="font-medium text-gray-500 mb-1">Món hàng:</div>
                                        {order.orderItems.map((item) => (
                                            <div key={item.id} className="flex justify-between text-gray-700">
                                                <span>{item.quantity}x {item.product.name}</span>
                                                <span className="text-gray-500">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-gray-600 px-1">
                                        <span>Tổng tiền hàng:</span>
                                        <span>{formatCurrency(calculateTotal(order) - order.shippingFee)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 px-1">
                                        <span>Phí vận chuyển:</span>
                                        <span>{formatCurrency(order.shippingFee)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-emerald-600 px-1 pt-2 border-t border-slate-100">
                                        <span>Cần Thu Thêm:</span>
                                        <span>{formatCurrency(Math.max(0, calculateTotal(order) - (order.depositAmount || 0)))}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Receipt Image Dialog - Full screen overlay style */}
            <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
                <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/90 border-none flex items-center justify-center z-[100]">
                    <button
                        onClick={() => setReceiptDialogOpen(false)}
                        className="absolute top-6 right-6 z-[110] p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Đóng"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    {receiptUrl && (
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={receiptUrl}
                                alt="Biên lai thanh toán"
                                className="max-w-full max-h-full object-contain shadow-2xl"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cập nhật Đơn Hàng</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Trạng thái</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WAITING_FOR_GOODS">Đợi hàng về</SelectItem>
                                    <SelectItem value="SHIPPING">Đang vận chuyển</SelectItem>
                                    <SelectItem value="DONE">Đã xong</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {newStatus === 'DONE' && (
                            <div className="space-y-2 text-sm text-rose-900 bg-rose-50 border border-rose-100 p-3 rounded-md">
                                Lưu ý: Nếu chuyển trạng thái sang &quot;Đã xong&quot;, hình ảnh hóa đơn cọc (nếu có) sẽ bị xóa khỏi hệ thống tự động để tiết kiệm dung lượng lưu trữ.
                            </div>
                        )}

                        {newStatus === 'SHIPPING' && (
                            <div className="space-y-2">
                                <Label>Mã vận đơn *</Label>
                                <Input
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value)}
                                    placeholder="Nhập mã vận đơn GHTK / ViettelPost..."
                                />
                            </div>
                        )}

                        {newStatus === 'DONE' && (
                            <div className="flex items-start space-x-3 p-3 bg-emerald-50 border border-emerald-100 rounded-md">
                                <input
                                    type="checkbox"
                                    id="confirm-payment"
                                    className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={confirmPayment}
                                    onChange={(e) => setConfirmPayment(e.target.checked)}
                                />
                                <label htmlFor="confirm-payment" className="text-sm font-medium text-emerald-900 cursor-pointer">
                                    Tôi xác nhận khách hàng đã thanh toán đầy đủ số tiền còn lại của đơn hàng này.
                                </label>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>Hủy</Button>
                            <Button onClick={submitStatusUpdate}>Lưu thay đổi</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
