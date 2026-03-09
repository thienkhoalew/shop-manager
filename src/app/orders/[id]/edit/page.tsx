'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

type Product = {
    id: string;
    name: string;
    basePrice: number;
    salePrice: number;
};

type OrderItemForm = {
    productId: string;
    quantity: number | '';
    product?: Product;
};

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [shippingFee, setShippingFee] = useState<number>(0);
    const [hasDeposit, setHasDeposit] = useState('no');
    const [depositAmount, setDepositAmount] = useState<number | ''>('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [existingReceiptImage, setExistingReceiptImage] = useState<string | null>(null);

    const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [initialData, setInitialData] = useState<string>('');

    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProductForm, setNewProductForm] = useState({
        name: '',
        basePrice: '',
        salePrice: '',
        description: '',
    });
    const [newProductFile, setNewProductFile] = useState<File | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch products
                const prodRes = await fetch('/api/products');
                const productsData = await prodRes.json();
                setProducts(productsData);

                // Fetch order
                const orderRes = await fetch('/api/orders');
                const orders = await orderRes.json();
                const order = orders.find((o: { id: string }) => o.id === id);

                if (!order) {
                    toast.error('Không tìm thấy đơn hàng');
                    router.push('/orders');
                    return;
                }

                setCustomerName(order.customerName || '');
                setCustomerPhone(order.customerPhone || '');
                setCustomerAddress(order.customerAddress || '');
                setShippingFee(order.shippingFee);
                setHasDeposit(order.hasDeposit ? 'yes' : 'no');
                setDepositAmount(order.depositAmount || '');
                setExistingReceiptImage(order.receiptImage);
                const orderItemsArr = order.orderItems.map((item: { productId: string; quantity: number; product: Product }) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    product: item.product
                }));
                setOrderItems(orderItemsArr);

                // Track initial state
                setInitialData(JSON.stringify({
                    customerName: order.customerName || '',
                    customerPhone: order.customerPhone || '',
                    customerAddress: order.customerAddress || '',
                    shippingFee: order.shippingFee,
                    hasDeposit: order.hasDeposit ? 'yes' : 'no',
                    depositAmount: order.depositAmount || '',
                    orderItems: orderItemsArr.map((i: { productId: string; quantity: number | '' }) => ({ productId: i.productId, quantity: i.quantity }))
                }));
            } catch {
                toast.error('Lỗi khi tải dữ liệu');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, router]);

    useEffect(() => {
        const currentData = JSON.stringify({
            customerName,
            customerPhone,
            customerAddress,
            shippingFee,
            hasDeposit,
            depositAmount,
            orderItems: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
        });

        if (initialData && currentData !== initialData) {
            setIsDirty(true);
        } else {
            setIsDirty(false);
        }
    }, [initialData, customerName, customerPhone, customerAddress, shippingFee, hasDeposit, depositAmount, orderItems]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isSaved && isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor && anchor.href && !isSaved && isDirty) {
                const url = new URL(anchor.href);
                // Compare pathnames correctly
                const targetPath = url.pathname.replace(/\/$/, '') || '/';
                const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

                if (url.origin === window.location.origin && targetPath !== currentPath) {
                    if (!window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?')) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }
                }
            }
        };

        window.addEventListener('click', handleAnchorClick, true);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('click', handleAnchorClick, true);
        };
    }, [isSaved, isDirty]);

    const handleAddNewProduct = async () => {
        setIsAddingProduct(true);
        try {
            let imageUrl = null;
            if (newProductFile) {
                const formData = new FormData();
                formData.append('file', newProductFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url;
                } else {
                    toast.error('Lỗi upload ảnh sản phẩm');
                    setIsAddingProduct(false);
                    return;
                }
            }

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newProductForm.name,
                    basePrice: newProductForm.basePrice,
                    salePrice: newProductForm.salePrice,
                    description: newProductForm.description,
                    imageUrl,
                }),
            });

            if (res.ok) {
                const addedProduct = await res.json();
                setProducts([...products, addedProduct]);
                setOrderItems(prev => [...prev, { productId: addedProduct.id, quantity: 1, product: addedProduct }]);
                toast.success('Thêm sản phẩm thành công');
                setIsAddProductOpen(false);
                setNewProductForm({ name: '', basePrice: '', salePrice: '', description: '' });
                setNewProductFile(null);
            }
        } catch {
            toast.error('Có lỗi xảy ra khi thêm sản phẩm');
        } finally {
            setIsAddingProduct(false);
        }
    };

    const addProductToOrder = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        if (orderItems.some(i => i.productId === productId)) {
            toast.error('Sản phẩm đã được chọn.');
            return;
        }
        setOrderItems([...orderItems, { productId, quantity: 1, product }]);
    };

    const updateQuantity = (idx: number, val: string) => {
        const newItems = [...orderItems];
        if (val === '') {
            newItems[idx].quantity = '';
        } else {
            const parsed = parseInt(val);
            if (!isNaN(parsed)) {
                newItems[idx].quantity = Math.max(1, parsed);
            }
        }
        setOrderItems(newItems);
    };

    const removeProduct = (idx: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== idx));
    };

    const calculateItemsTotal = () => {
        return orderItems.reduce((acc, item) => acc + ((item.product?.salePrice || 0) * (Number(item.quantity) || 0)), 0);
    };

    const totalAmount = calculateItemsTotal() + shippingFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (orderItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 sản phẩm.');
            return;
        }

        setIsSubmitting(true);
        let receiptImageUrl = existingReceiptImage;

        try {
            if (hasDeposit === 'yes' && receiptFile) {
                const formData = new FormData();
                formData.append('file', receiptFile);
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    receiptImageUrl = uploadData.url;
                }
            }

            const orderPayload = {
                customerName,
                customerPhone,
                customerAddress,
                shippingFee,
                hasDeposit: hasDeposit === 'yes',
                depositAmount: hasDeposit === 'yes' ? depositAmount : null,
                receiptImage: receiptImageUrl,
                items: orderItems.map(item => ({
                    productId: item.productId,
                    quantity: Number(item.quantity) || 1,
                    basePrice: item.product?.basePrice || 0,
                    salePrice: item.product?.salePrice || 0,
                }))
            };

            const res = await fetch(`/api/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            if (res.ok) {
                toast.success('Cập nhật đơn hàng thành công');
                setIsSaved(true);
                router.push('/orders');
            } else {
                toast.error('Cập nhật đơn hàng thất bại');
            }
        } catch {
            toast.error('Có lỗi xảy ra.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center">Đang tải thông tin đơn hàng...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-800">Chỉnh Sửa Đơn Hàng</h1>
                <p className="text-muted-foreground">Cập nhật thông tin khách hàng hoặc danh sách sản phẩm</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="name">Họ Tên Khách Hàng *</Label>
                        <Input
                            id="name"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Số Điện Thoại *</Label>
                        <Input
                            id="phone"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Địa Chỉ *</Label>
                        <Input
                            id="address"
                            required
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
                    <h2 className="text-xl font-semibold text-slate-800">Sản Phẩm Trong Đơn</h2>
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                            <select
                                title="Chọn sản phẩm"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        addProductToOrder(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                            >
                                <option value="">-- Thêm sản phẩm khác --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} - {formatPrice(p.salePrice)} đ</option>
                                ))}
                            </select>

                            <Button
                                type="button"
                                variant="outline"
                                className="shrink-0 whitespace-nowrap w-full md:w-auto"
                                onClick={() => setIsAddProductOpen(true)}
                            >
                                + Sản phẩm mới
                            </Button>
                        </div>

                        {orderItems.map((item, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md gap-3">
                                <div className="flex-1">
                                    <div className="font-medium">{item.product?.name}</div>
                                    <div className="text-xs text-slate-500">
                                        <span className="mr-3 text-slate-500">Gốc: {formatPrice(item.product?.basePrice || 0)} đ</span>
                                        <span className="font-semibold text-rose-600">Bán: {formatPrice(item.product?.salePrice || 0)} đ</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label>SL:</Label>
                                        <Input type="number" min="1" className="w-16 h-8" value={item.quantity} onChange={(e) => updateQuantity(idx, e.target.value)} />
                                    </div>
                                    <div className="font-medium text-rose-600 min-w-[80px] text-right">
                                        {formatPrice((item.product?.salePrice || 0) * (Number(item.quantity) || 0))} đ
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeProduct(idx)}>Xóa</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border shadow-sm">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Phí Ship (VNĐ)</Label>
                            <Input type="number" min="0" value={shippingFee} onChange={(e) => setShippingFee(Number(e.target.value))} />
                        </div>
                        <div className="space-y-4 pt-2 border-t">
                            <Label>Trạng Thái Cọc</Label>
                            <RadioGroup value={hasDeposit} onValueChange={setHasDeposit} className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="deposit-no" /><Label htmlFor="deposit-no">Chưa cọc</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="deposit-yes" /><Label htmlFor="deposit-yes">Đã cọc</Label></div>
                            </RadioGroup>
                        </div>
                        {hasDeposit === 'yes' && (
                            <div className="space-y-4 pl-6 border-l-2 border-slate-200">
                                <Label>Số Tiền Đã Cọc (VNĐ)</Label>
                                <Input type="number" min="0" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} />
                                {existingReceiptImage && (
                                    <div className="text-xs text-rose-500">Đã có ảnh biên lai. Tải tệp mới nếu muốn thay thế.</div>
                                )}
                                <Input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                            </div>
                        )}
                    </div>
                    <div className="bg-slate-50 p-6 rounded-lg flex flex-col justify-center border h-full">
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-600"><span>Tổng hàng:</span><span>{formatPrice(calculateItemsTotal())} đ</span></div>
                            <div className="flex justify-between text-gray-600"><span>Phí ship:</span><span>{formatPrice(shippingFee)} đ</span></div>
                            {hasDeposit === 'yes' && <div className="flex justify-between text-rose-600 pt-2 border-t"><span>Đã cọc:</span><span>- {formatPrice(Number(depositAmount || 0))} đ</span></div>}
                            <div className="flex justify-between text-xl font-bold pt-4 border-t mt-4 text-slate-800">
                                <span>Cần Thu:</span>
                                <span>{formatPrice(Math.max(0, totalAmount - (hasDeposit === 'yes' ? Number(depositAmount || 0) : 0)))} đ</span>
                            </div>
                        </div>
                        <div className="mt-8">
                            <Button type="submit" className="w-full text-lg h-12 bg-rose-600 hover:bg-rose-700" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang cập nhật...' : 'CẬP NHẬT ĐƠN HÀNG'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Dialog is OUTSIDE the form to avoid triggering form submit */}
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo Sản Phẩm Mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-new-name">Tên sản phẩm *</Label>
                            <Input id="edit-new-name" value={newProductForm.name} onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-new-description">Mô tả</Label>
                            <Input id="edit-new-description" value={newProductForm.description} onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-new-base-price">Giá gốc (VNĐ)</Label>
                                <Input id="edit-new-base-price" type="number" min="0" value={newProductForm.basePrice} onChange={(e) => setNewProductForm({ ...newProductForm, basePrice: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-new-sale-price">Giá bán (VNĐ) *</Label>
                                <Input id="edit-new-sale-price" type="number" min="0" value={newProductForm.salePrice} onChange={(e) => setNewProductForm({ ...newProductForm, salePrice: e.target.value })} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-new-image">Ảnh sản phẩm</Label>
                            <Input
                                id="edit-new-image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setNewProductFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>Hủy</Button>
                            <Button type="button" disabled={isAddingProduct} onClick={handleAddNewProduct}>
                                {isAddingProduct ? 'Đang lưu...' : 'Lưu & Chọn'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
