'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { MapPin, Trash2, Pencil, Copy, FileText, Printer } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getDisplayCodTotal, getDisplayProductTotal } from '@/lib/order-display';

type OrderItem = {
    id: string;
    quantity: number;
    basePrice: number;
    salePrice: number;
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
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [trackingCode, setTrackingCode] = useState<string>('');
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [confirmPayment, setConfirmPayment] = useState(false);
    const [billOrder, setBillOrder] = useState<Order | null>(null);
    const [isBillOpen, setIsBillOpen] = useState(false);
    const handlePrintBill = useCallback(() => {
        if (!billOrder) return;
        router.push(`/orders/${billOrder.id}/invoice`);
    }, [billOrder, router]);

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

    const formatCurrency = useCallback((amt: number) => `${formatPrice(amt)}\u00A0đ`, []);

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

    const calculateProductTotal = useCallback((order: Order) => {
        return getDisplayProductTotal(order.orderItems);
    }, []);

    const calculateCodTotal = useCallback((order: Order) => {
        return getDisplayCodTotal({
            items: order.orderItems,
            depositAmount: order.depositAmount,
        });
    }, []);

    const calculateProfit = useCallback((order: Order) => {
        return order.orderItems.reduce((acc, item) => acc + ((item.salePrice - item.basePrice) * item.quantity), 0);
    }, []);

    const calculateCost = useCallback((order: Order) => {
        return order.orderItems.reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);
    }, []);

    const filteredOrders = useMemo(() => orders.filter(order => {
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

        let matchesDate = true;
        if (dateFilter) {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            matchesDate = orderDate === dateFilter;
        }

        return matchesStatus && matchesDate;
    }), [orders, statusFilter, dateFilter]);

    const toggleExpand = useCallback((orderId: string) => {
        setExpandedOrders(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(orderId)) {
                newExpanded.delete(orderId);
            } else {
                newExpanded.add(orderId);
            }
            return newExpanded;
        });
    }, []);

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

    const handleCopy = useCallback((text: string, message: string = 'Đã sao chép') => {
        navigator.clipboard.writeText(text);
        toast.success(message);
    }, []);

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
                            <TableHead>Tổng tiền hàng</TableHead>
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
                                            {order.customerPhone ? (
                                                <div className="text-sm text-gray-500 flex items-center gap-1.5 group">
                                                    <button
                                                        onClick={() => handleCopy(order.customerPhone || '', 'Đã sao chép số điện thoại')}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-rose-500 transition-colors"
                                                        title="Sao chép số điện thoại"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                    <span>{order.customerPhone}</span>
                                                </div>
                                            ) : null}
                                            {order.customerAddress ? (
                                                <div className="text-xs text-slate-600 mt-1.5 flex items-start gap-1 group">
                                                    <button
                                                        onClick={() => handleCopy(order.customerAddress || '', 'Đã sao chép địa chỉ')}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-rose-500 transition-colors shrink-0 -mt-1"
                                                        title="Sao chép địa chỉ"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                                                    <span className="leading-relaxed">{order.customerAddress}</span>
                                                </div>
                                            ) : null}
                                            {!order.customerPhone && !order.customerAddress && (
                                                <div className="text-xs text-slate-400 italic mt-1 font-medium">Khách cũ (SPX)</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center gap-2 font-medium text-rose-600">
                                                {formatCurrency(calculateProductTotal(order))}
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
                                            <div className="mt-1 text-[11px] text-slate-500">
                                                Ship: {formatCurrency(order.shippingFee)}
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
                                                        onClick={() => handleCopy(order.trackingCode!, 'Đã sao chép mã vận đơn')}
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
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1"
                                                    onClick={() => { setBillOrder(order); setIsBillOpen(true); }}
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    Hóa đơn
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
                                                                    <div key={item.id} className="flex flex-col border-b pb-1 last:border-0 last:pb-0 border-slate-100">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-gray-700 font-medium">{item.quantity}x {item.product.name}</span>
                                                                            <span className="text-gray-600 font-medium">{formatCurrency(item.salePrice * item.quantity)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 italic">
                                                                            <span>Gốc: {formatCurrency(item.basePrice)}/món</span>
                                                                            <span>Lời: {formatCurrency((item.salePrice - item.basePrice) * item.quantity)}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-500 mb-2">Thanh toán</div>
                                                            <div className="space-y-1 text-gray-600">
                                                                <div className="flex justify-between">
                                                                    <span>Tổng tiền hàng:</span>
                                                                    <span>{formatCurrency(calculateProductTotal(order))}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Phí ship:</span>
                                                                    <span>{formatCurrency(order.shippingFee)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-blue-600 font-medium border-t border-slate-200 mt-2 pt-1">
                                                                    <span>Tiền lấy hàng:</span>
                                                                    <span>{formatCurrency(calculateCost(order))}</span>
                                                                </div>
                                                                <div className="flex justify-between text-emerald-600 font-bold border-t border-slate-200 mt-1 pt-1">
                                                                    <span>Tiền lời:</span>
                                                                    <span>{formatCurrency(calculateProfit(order))}</span>
                                                                </div>
                                                                <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200 mt-1">
                                                                    <span>Tiền COD:</span>
                                                                    <span>{formatCurrency(calculateCodTotal(order))}</span>
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
                                    {order.customerPhone ? (
                                        <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleCopy(order.customerPhone || '', 'Đã sao chép số điện thoại')}
                                                className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-gray-400 hover:text-rose-500 transition-colors border border-slate-100"
                                                title="Sao chép số điện thoại"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                            <span>{order.customerPhone}</span>
                                        </div>
                                    ) : null}
                                    {order.customerAddress ? (
                                        <div className="text-xs text-slate-600 mt-1.5 flex items-start gap-1">
                                            <button
                                                onClick={() => handleCopy(order.customerAddress || '', 'Đã sao chép địa chỉ')}
                                                className="p-1 bg-slate-50 hover:bg-slate-100 rounded text-gray-400 hover:text-rose-500 transition-colors border border-slate-100 shrink-0 -mt-1"
                                                title="Sao chép địa chỉ"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                                            <span className="leading-relaxed">{order.customerAddress}</span>
                                        </div>
                                    ) : null}
                                    {!order.customerPhone && !order.customerAddress && (
                                        <div className="text-xs text-slate-400 italic mt-1 font-medium">Khách cũ (SPX)</div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <div className="font-bold text-rose-600">{formatCurrency(calculateProductTotal(order))}</div>
                                        <button
                                            onClick={() => toggleExpand(order.id)}
                                            className="text-gray-400 p-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${expandedOrders.has(order.id) ? 'rotate-180' : ''}`}>
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="mt-1 text-[11px] text-slate-500">
                                        Ship: {formatCurrency(order.shippingFee)}
                                    </div>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getStatusStyles(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500">Đã cọc:</span>
                                        <span className="font-medium text-rose-600">{formatCurrency(order.depositAmount || 0)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-right">
                                        <span className="text-gray-500">Tiền COD:</span>
                                        <span className="font-medium text-rose-600">{formatCurrency(calculateCodTotal(order))}</span>
                                    </div>
                                </div>
                                {order.hasDeposit && order.receiptImage && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                        onClick={() => {
                                            setReceiptUrl(order.receiptImage);
                                            setReceiptDialogOpen(true);
                                        }}
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
                                        onClick={() => handleCopy(order.trackingCode!, 'Đã sao chép mã vận đơn')}
                                        className="shrink-0 p-1.5 bg-white border rounded shadow-sm hover:text-rose-500 transition-colors"
                                        title="Sao chép"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-2">
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs px-3 flex items-center gap-1"
                                    onClick={() => { setBillOrder(order); setIsBillOpen(true); }}
                                >
                                    <FileText className="w-4 h-4" />
                                    Hóa đơn
                                </Button>
                                <Button variant="outline" size="sm" className="h-9 text-xs px-3" onClick={() => handleOpenUpdate(order)}>
                                    Trạng thái
                                </Button>
                            </div>

                            {expandedOrders.has(order.id) && (
                                <div className="pt-3 border-t border-slate-100 flex flex-col gap-3 text-sm">
                                    <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-2">
                                        <div className="font-medium text-gray-500 mb-1">Món hàng:</div>
                                        {order.orderItems.map((item) => (
                                            <div key={item.id} className="flex flex-col border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                                                <div className="flex justify-between text-gray-700">
                                                    <span>{item.quantity}x {item.product.name}</span>
                                                    <span className="text-gray-500">{formatCurrency(item.salePrice * item.quantity)}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 italic">
                                                    <span>Gốc: {formatCurrency(item.basePrice)}/món</span>
                                                    <span>Lời: {formatCurrency((item.salePrice - item.basePrice) * item.quantity)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-gray-600 px-1">
                                        <span>Tổng tiền hàng:</span>
                                        <span>{formatCurrency(calculateProductTotal(order))}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 px-1">
                                        <span>Phí vận chuyển:</span>
                                        <span>{formatCurrency(order.shippingFee)}</span>
                                    </div>
                                    <div className="flex justify-between text-blue-600 px-1 pt-2 border-t border-slate-100">
                                        <span>Tiền lấy hàng:</span>
                                        <span>{formatCurrency(calculateCost(order))}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-rose-600 px-1 pt-1">
                                        <span>Tiền lời:</span>
                                        <span>{formatCurrency(calculateProfit(order))}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-emerald-600 px-1 pt-2 border-t border-slate-100">
                                        <span>Tiền COD:</span>
                                        <span>{formatCurrency(calculateCodTotal(order))}</span>
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
                            <Image
                                src={receiptUrl}
                                alt="Biên lai thanh toán"
                                fill
                                className="object-contain"
                                priority
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

            {/* Bill Preview Dialog */}
            <Dialog open={isBillOpen} onOpenChange={setIsBillOpen}>
                <DialogContent className="invoice-print-shell max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="invoice-print-header">
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-rose-500" />
                            Hóa Đơn Bán Hàng
                        </DialogTitle>
                    </DialogHeader>
                    {billOrder && (
                        <div id="bill-content" className="invoice-print-card p-6 bg-white border rounded-lg space-y-6 text-slate-800">
                            <div className="text-center border-b pb-4">
                                <h2 className="text-2xl font-bold uppercase tracking-wider">Hóa Đơn Thanh Toán</h2>
                                    <p className="text-sm text-slate-500 mt-1">{billOrder.createdAt ? new Date(billOrder.createdAt).toLocaleDateString('vi-VN') : ''}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Khách hàng</p>
                                    <p className="font-semibold text-base">{billOrder.customerName}</p>
                                    {billOrder.customerPhone && <p>{billOrder.customerPhone}</p>}
                                    {billOrder.customerAddress && (
                                        <p className="text-xs text-slate-500 mt-1 italic">{billOrder.customerAddress}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Cửa hàng</p>
                                    <p className="font-semibold">Rim Cưng Cosmetics</p>
                                    <p className="text-xs text-slate-500">Hỗ trợ nhanh: 0333586853</p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr className="text-[11px] uppercase tracking-tight">
                                            <th className="text-left py-1 px-2">Sản phẩm</th>
                                            <th className="text-center py-1 px-2 w-10">SL</th>
                                            <th className="text-right py-1 px-2">Đơn giá</th>
                                            <th className="text-right py-1 px-2">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[12px]">
                                        {billOrder.orderItems.map((item) => (
                                            <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                                <td className="py-1 px-2 font-medium leading-tight">{item.product.name}</td>
                                                <td className="py-1 px-2 text-center">{item.quantity}</td>
                                                <td className="py-1 px-2 text-right">{formatCurrency(item.salePrice)}</td>
                                                <td className="py-1 px-2 text-right font-semibold">
                                                    {formatCurrency(item.salePrice * item.quantity)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-1 pt-1.5 border-t text-[12px]">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tổng tiền hàng:</span>
                                    <span>{formatCurrency(calculateProductTotal(billOrder))}</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-500">
                                    <span className="text-slate-500">Phí vận chuyển:</span>
                                    <span>{formatCurrency(billOrder.shippingFee)}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold border-t pt-1.5 mt-1.5">
                                    <span>Tổng tiền hàng:</span>
                                    <span className="text-rose-600">{formatCurrency(calculateProductTotal(billOrder))}</span>
                                </div>
                                {billOrder.hasDeposit && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Đã đặt cọc:</span>
                                        <span>- {formatCurrency(billOrder.depositAmount || 0)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold bg-rose-50 p-1.5 rounded mt-1">
                                    <span>Tiền COD:</span>
                                    <span className="text-rose-700">{formatCurrency(calculateCodTotal(billOrder))}</span>
                                </div>
                            </div>

                            <div className="text-center pt-6 italic text-slate-400 text-xs gap-1 flex flex-col">
                                <p>Cảm ơn quý khách đã tin tưởng và ủng hộ!</p>
                                <p>Vui lòng kiểm tra hàng kỹ trước khi thanh toán.</p>
                            </div>
                        </div>
                    )}
                    <div className="invoice-print-actions flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsBillOpen(false)}>Đóng</Button>
                        <Button className="gap-2" onClick={handlePrintBill}>
                            <Printer className="w-4 h-4" />
                            In hóa đơn
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
