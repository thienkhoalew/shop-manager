import { getDisplayCodTotal, getDisplayProductTotal } from '@/lib/order-display';
import { formatPrice } from '@/lib/utils';

type InvoiceOrderItem = {
    id: string;
    quantity: number;
    salePrice: number;
    product: {
        name: string;
    };
};

export type InvoiceOrder = {
    id: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string | null;
    shippingFee: number;
    hasDeposit: boolean;
    depositAmount: number | null;
    createdAt: string | Date;
    orderItems: InvoiceOrderItem[];
};

function formatCurrency(amount: number) {
    return `${formatPrice(amount)} đ`;
}

export function OrderInvoiceDocument({ order }: { order: InvoiceOrder }) {
    const productTotal = getDisplayProductTotal(order.orderItems);
    const codTotal = getDisplayCodTotal({
        items: order.orderItems,
        depositAmount: order.depositAmount,
    });

    return (
        <div id="bill-content" className="invoice-print-card p-6 bg-white border rounded-lg space-y-6 text-slate-800">
            <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold uppercase tracking-wider">Hóa Đơn Thanh Toán</h2>
                <p className="text-sm text-slate-500 mt-1">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Khách hàng</p>
                    <p className="font-semibold text-base">{order.customerName}</p>
                    {order.customerPhone ? <p>{order.customerPhone}</p> : null}
                    {order.customerAddress ? (
                        <p className="text-xs text-slate-500 mt-1 italic">{order.customerAddress}</p>
                    ) : null}
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
                        {order.orderItems.map((item) => (
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
                    <span>{formatCurrency(productTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Phí vận chuyển:</span>
                    <span>{formatCurrency(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-1.5 mt-1.5">
                    <span>Tổng tiền hàng:</span>
                    <span className="text-rose-600">{formatCurrency(productTotal)}</span>
                </div>
                {order.hasDeposit ? (
                    <div className="flex justify-between text-emerald-600">
                        <span>Đã đặt cọc:</span>
                        <span>- {formatCurrency(order.depositAmount || 0)}</span>
                    </div>
                ) : null}
                <div className="flex justify-between text-sm font-bold bg-rose-50 p-1.5 rounded mt-1">
                    <span>Tiền COD:</span>
                    <span className="text-rose-700">{formatCurrency(codTotal)}</span>
                </div>
            </div>

            <div className="text-center pt-6 italic text-slate-400 text-xs gap-1 flex flex-col">
                <p>Cảm ơn quý khách đã tin tưởng và ủng hộ!</p>
                <p>Vui lòng kiểm tra hàng kỹ trước khi thanh toán.</p>
            </div>
        </div>
    );
}
