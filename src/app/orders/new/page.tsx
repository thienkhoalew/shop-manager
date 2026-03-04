'use client';

import { useState, useEffect } from 'react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

type Product = {
    id: string;
    name: string;
    price: number;
};

type OrderItemForm = {
    productId: string;
    quantity: number | '';
    product?: Product;
};

export default function NewOrderPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [shippingFee, setShippingFee] = useState<number>(0);
    const [hasDeposit, setHasDeposit] = useState('no');
    const [depositAmount, setDepositAmount] = useState<number | ''>('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProductForm, setNewProductForm] = useState({
        name: '',
        price: '',
        description: '',
    });
    const [newProductFile, setNewProductFile] = useState<File | null>(null);

    useEffect(() => {
        fetch('/api/products')
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch(() => toast.error('Lỗi khi tải sản phẩm'));
    }, []);

    const handleAddNewProduct = async (e: React.FormEvent) => {
        e.preventDefault();
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
                    price: newProductForm.price,
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
                setNewProductForm({ name: '', price: '', description: '' });
                setNewProductFile(null);
            } else {
                toast.error('Có lỗi xảy ra khi thêm sản phẩm');
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

        // Check if already in list
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
        return orderItems.reduce((acc, item) => acc + ((item.product?.price || 0) * (Number(item.quantity) || 0)), 0);
    };

    const totalAmount = calculateItemsTotal() + shippingFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (orderItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 sản phẩm.');
            return;
        }

        setIsSubmitting(true);
        let receiptImageUrl = null;

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
                } else {
                    toast.error('Lỗi upload ảnh chuyển khoản');
                    setIsSubmitting(false);
                    return;
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
                    price: item.product?.price || 0,
                }))
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            if (res.ok) {
                toast.success('Tạo đơn hàng thành công');
                router.push('/orders');
            } else {
                toast.error('Tạo đơn hàng thất bại');
            }
        } catch {
            toast.error('Có lỗi xảy ra trong quá trình tạo đơn.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tạo Đơn Hàng Mới</h1>
                <p className="text-muted-foreground">Nhập thông tin khách hàng và chọn sản phẩm</p>
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
                            placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
                    <h2 className="text-xl font-semibold">Sản Phẩm Trong Đơn</h2>

                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                            <select
                                title="Sản phẩm"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        addProductToOrder(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                            >
                                <option value="">-- Chọn sản phẩm để thêm vào đơn --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} - {formatPrice(p.price)} đ</option>
                                ))}
                            </select>

                            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" className="shrink-0 whitespace-nowrap w-full md:w-auto">
                                        + Sản phẩm mới
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Tạo Sản Phẩm Mới</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddNewProduct} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="new-name">Tên sản phẩm *</Label>
                                            <Input
                                                id="new-name"
                                                value={newProductForm.name}
                                                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-description">Mô tả</Label>
                                            <Input
                                                id="new-description"
                                                value={newProductForm.description}
                                                onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-price">Giá (VNĐ) *</Label>
                                            <Input
                                                id="new-price"
                                                type="number"
                                                min="0"
                                                value={newProductForm.price}
                                                onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-image">Ảnh sản phẩm</Label>
                                            <Input
                                                id="new-image"
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
                                            <Button type="submit" disabled={isAddingProduct}>
                                                {isAddingProduct ? 'Đang lưu...' : 'Lưu & Chọn'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {orderItems.length > 0 && (
                            <div className="space-y-3 pt-4">
                                {orderItems.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md gap-3">
                                        <div className="flex-1">
                                            <div className="font-medium">{item.product?.name}</div>
                                            <div className="text-sm text-gray-500">{formatPrice(item.product?.price || 0)} đ</div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                                            <div className="flex items-center gap-2">
                                                <Label>SL:</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    className="w-16 h-8"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(idx, e.target.value)}
                                                />
                                            </div>
                                            <div className="font-medium min-w-[100px] text-right text-rose-600">
                                                {formatPrice((item.product?.price || 0) * (Number(item.quantity) || 0))} đ
                                            </div>
                                            <Button type="button" variant="destructive" size="sm" onClick={() => removeProduct(idx)}>Xóa</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border shadow-sm">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Phi Ship (VNĐ)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={shippingFee}
                                onChange={(e) => setShippingFee(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-4 pt-2 border-t">
                            <Label>Trạng Thái Cọc</Label>
                            <RadioGroup value={hasDeposit} onValueChange={setHasDeposit} className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="no" id="deposit-no" />
                                    <Label htmlFor="deposit-no">Chưa cọc</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="yes" id="deposit-yes" />
                                    <Label htmlFor="deposit-yes">Đã cọc</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {hasDeposit === 'yes' && (
                            <div className="space-y-4 pl-6 border-l-2 border-slate-200">
                                <div className="space-y-2">
                                    <Label>Số Tiền Đã Cọc (VNĐ) *</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        required
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tải Ảnh Chuyển Khoản</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setReceiptFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg flex flex-col justify-center border h-full">
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Tổng tiền hàng:</span>
                                <span>{formatPrice(calculateItemsTotal())} đ</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Phí vận chuyển:</span>
                                <span>{formatPrice(shippingFee)} đ</span>
                            </div>

                            {hasDeposit === 'yes' && (
                                <div className="flex justify-between text-rose-600 font-medium pt-2 border-t">
                                    <span>Đã cọc:</span>
                                    <span>- {formatPrice(Number(depositAmount || 0))} đ</span>
                                </div>
                            )}

                            <div className="flex justify-between text-xl font-bold pt-4 border-t mt-4 text-slate-800">
                                <span>Cần Thu Thêm:</span>
                                <span>
                                    {formatPrice(Math.max(0, totalAmount - (hasDeposit === 'yes' ? Number(depositAmount || 0) : 0)))} đ
                                </span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Button type="submit" className="w-full text-lg h-12" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang tạo đơn...' : 'HOÀN TẤT TẠO ĐƠN'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}