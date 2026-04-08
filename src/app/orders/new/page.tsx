'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getDisplayCodTotal, getDisplayProductTotal } from '@/lib/order-display';
import { getProductSearchResults } from '@/lib/product-search';
import { printInvoiceFromElement } from '@/lib/print-invoice';
import { findBestProductMatch, type ParsedOrderDraft } from '@/lib/order-ai';
import { FileText, LoaderCircle, Printer, Search, Sparkles } from 'lucide-react';

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
    const [isOldCustomer, setIsOldCustomer] = useState(false);
    const [isBillOpen, setIsBillOpen] = useState(false);
    const [quickPasteText, setQuickPasteText] = useState('');
    const [isParsingQuickPaste, setIsParsingQuickPaste] = useState(false);
    const [parseNotes, setParseNotes] = useState<string[]>([]);
    const [isFullDeposit, setIsFullDeposit] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProductForm, setNewProductForm] = useState({
        name: '',
        basePrice: '',
        salePrice: '',
        description: '',
    });
    const [newProductFile, setNewProductFile] = useState<File | null>(null);
    const handlePrintBill = useCallback(() => {
        const billElement = document.getElementById('bill-content');
        printInvoiceFromElement(billElement, 'Hoa don ban hang');
    }, []);

    useEffect(() => {
        fetch('/api/products')
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch(() => toast.error('Lỗi khi tải sản phẩm'));
    }, []);

    // Sync deposit amount if "full deposit" is active
    useEffect(() => {
        if (isFullDeposit && hasDeposit === 'yes') {
            const total = orderItems.reduce((acc, item) => acc + ((item.product?.salePrice || 0) * (Number(item.quantity) || 0)), 0);
            setDepositAmount(total);
        }
    }, [orderItems, isFullDeposit, hasDeposit]);

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
            } else {
                toast.error('Có lỗi xảy ra khi thêm sản phẩm');
            }
        } catch {
            toast.error('Có lỗi xảy ra khi thêm sản phẩm');
        } finally {
            setIsAddingProduct(false);
        }
    };

    const addProductToOrder = useCallback((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Check if already in list
        if (orderItems.some(i => i.productId === productId)) {
            toast.error('Sản phẩm đã được chọn.');
            return;
        }

        setOrderItems([...orderItems, { productId, quantity: 1, product }]);
    }, [products, orderItems]);

    const selectedProductIds = useMemo(
        () => orderItems.map((item) => item.productId),
        [orderItems]
    );

    const productSearchResults = useMemo(() => {
        return getProductSearchResults({
            products,
            query: productSearchQuery,
            selectedProductIds,
        });
    }, [productSearchQuery, products, selectedProductIds]);

    const handleSelectSuggestedProduct = useCallback((productId: string) => {
        addProductToOrder(productId);
        setProductSearchQuery('');
        setIsProductSearchOpen(false);
    }, [addProductToOrder]);

    const updateQuantity = useCallback((idx: number, val: string) => {
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
    }, [orderItems]);

    const removeProduct = useCallback((idx: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== idx));
    }, [orderItems]);

    const applyParsedOrderDraft = useCallback((draft: ParsedOrderDraft) => {
        const unmatchedProducts: string[] = [];
        const matchedOrderItems: OrderItemForm[] = draft.items.flatMap((item) => {
            const product = findBestProductMatch(products, item.productId, item.productName);

            if (!product) {
                unmatchedProducts.push(item.productName);
                return [];
            }

            return [{
                productId: product.id,
                quantity: item.quantity || 1,
                product,
            }];
        });

        setCustomerName(draft.customerName ?? '');
        setCustomerPhone(draft.customerPhone ?? '');
        setCustomerAddress(draft.customerAddress ?? '');
        setShippingFee(draft.shippingFee ?? 0);
        setIsOldCustomer(draft.isOldCustomer ?? false);

        if (draft.depositStatus === 'full_deposit') {
            setHasDeposit('yes');
            setIsFullDeposit(true);
            setDepositAmount(draft.depositAmount ?? '');
        } else if (draft.depositStatus === 'partial_deposit') {
            setHasDeposit('yes');
            setIsFullDeposit(false);
            setDepositAmount(draft.depositAmount ?? '');
        } else {
            setHasDeposit('no');
            setIsFullDeposit(false);
            setDepositAmount('');
        }

        setOrderItems(matchedOrderItems);
        setParseNotes([
            ...draft.notes,
            ...unmatchedProducts.map((productName) => `Chưa ghép được sản phẩm trong catalog: ${productName}`),
        ]);

        if (matchedOrderItems.length > 0) {
            toast.success(`AI đã điền ${matchedOrderItems.length} sản phẩm vào đơn.`);
        } else {
            toast.error('AI chưa ghép được sản phẩm nào từ nội dung vừa dán.');
        }

        if (unmatchedProducts.length > 0) {
            toast.error(`Có ${unmatchedProducts.length} sản phẩm chưa ghép được vào danh mục hiện tại.`);
        }
    }, [products]);

    const handleParseQuickPaste = useCallback(async () => {
        if (!quickPasteText.trim()) {
            toast.error('Vui lòng dán nội dung đơn hàng trước.');
            return;
        }

        setIsParsingQuickPaste(true);
        setParseNotes([]);

        try {
            const res = await fetch('/api/orders/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: quickPasteText }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || 'AI chưa phân tích được nội dung này.');
            }

            applyParsedOrderDraft(data as ParsedOrderDraft);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể phân tích nội dung bằng AI.');
        } finally {
            setIsParsingQuickPaste(false);
        }
    }, [applyParsedOrderDraft, quickPasteText]);

    const calculateItemsTotal = useCallback(() => {
        return getDisplayProductTotal(
            orderItems.map((item) => ({
                salePrice: item.product?.salePrice || 0,
                quantity: Number(item.quantity) || 0,
            }))
        );
    }, [orderItems]);

    const codAmount = useMemo(() => {
        return getDisplayCodTotal({
            items: orderItems.map((item) => ({
                salePrice: item.product?.salePrice || 0,
                quantity: Number(item.quantity) || 0,
            })),
            depositAmount: hasDeposit === 'yes' ? Number(depositAmount || 0) : 0,
        });
    }, [depositAmount, hasDeposit, orderItems]);

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
                customerPhone: isOldCustomer ? null : customerPhone,
                customerAddress: isOldCustomer ? null : customerAddress,
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
                {/* Quick Paste Section */}
                <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 space-y-3">
                    <Label htmlFor="quick-paste" className="flex items-center gap-2 text-rose-800 font-bold">
                        <FileText className="w-4 h-4" />
                        DÁN THÔNG TIN NHANH
                    </Label>
                    <textarea
                        id="quick-paste"
                        className="w-full h-24 p-2 text-sm border rounded-md focus:ring-rose-500 focus:border-rose-500"
                        placeholder="Dán nội dung đơn hàng vào đây để tự động điền thông tin..."
                        value={quickPasteText}
                        onChange={(e) => setQuickPasteText(e.target.value)}
                    />
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <p className="text-[10px] text-rose-500 italic">
                            Dán tin nhắn tự do, AI sẽ tự nhận diện khách hàng, sản phẩm, ship và tiền cọc.
                        </p>
                        <Button
                            type="button"
                            className="gap-2 w-full md:w-auto"
                            onClick={handleParseQuickPaste}
                            disabled={isParsingQuickPaste || products.length === 0}
                        >
                            {isParsingQuickPaste ? (
                                <>
                                    <LoaderCircle className="w-4 h-4 animate-spin" />
                                    Đang phân tích...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    AI điền form
                                </>
                            )}
                        </Button>
                    </div>
                    {parseNotes.length > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 space-y-1">
                            {parseNotes.map((note, index) => (
                                <p key={`${index}-${note}`}>{note}</p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="name">Họ Tên Khách Hàng *</Label>
                        <Input
                            id="name"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                        <div className="flex items-center space-x-2 pt-1">
                            <input
                                type="checkbox"
                                id="old-customer"
                                className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                                checked={isOldCustomer}
                                onChange={(e) => setIsOldCustomer(e.target.checked)}
                            />
                            <Label htmlFor="old-customer" className="text-sm font-medium leading-none cursor-pointer">
                                Khách cũ (Đã có thông tin trên SPX)
                            </Label>
                        </div>
                    </div>

                    {!isOldCustomer && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Số Điện Thoại *</Label>
                                <Input
                                    id="phone"
                                    required={!isOldCustomer}
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Địa Chỉ *</Label>
                                <Input
                                    id="address"
                                    required={!isOldCustomer}
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
                    <h2 className="text-xl font-semibold">Sản Phẩm Trong Đơn</h2>

                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    value={productSearchQuery}
                                    onChange={(e) => {
                                        setProductSearchQuery(e.target.value);
                                        setIsProductSearchOpen(true);
                                    }}
                                    onFocus={() => {
                                        if (productSearchQuery.trim()) {
                                            setIsProductSearchOpen(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => setIsProductSearchOpen(false), 100);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (productSearchResults.length > 0) {
                                                handleSelectSuggestedProduct(productSearchResults[0].id);
                                            }
                                        }
                                        if (e.key === 'Escape') {
                                            setIsProductSearchOpen(false);
                                        }
                                    }}
                                    placeholder="Tìm sản phẩm để thêm vào đơn..."
                                    className="pl-9"
                                />
                                {isProductSearchOpen && productSearchQuery.trim() && (
                                    <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                                        {productSearchResults.length > 0 ? (
                                            productSearchResults.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleSelectSuggestedProduct(product.id);
                                                    }}
                                                >
                                                    <span className="font-medium text-slate-700">{product.name}</span>
                                                    <span className="text-xs text-rose-600">{formatPrice(product.salePrice)} đ</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-slate-500">
                                                Không tìm thấy sản phẩm phù hợp
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="shrink-0 whitespace-nowrap w-full md:w-auto"
                                onClick={() => setIsAddProductOpen(true)}
                            >
                                + Sản phẩm mới
                            </Button>
                        </div>

                        {orderItems.length > 0 && (
                            <div className="space-y-3 pt-4">
                                {orderItems.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md gap-3">
                                        <div className="flex-1">
                                            <div className="font-medium">{item.product?.name}</div>
                                            <div className="text-xs text-slate-500">
                                                <span className="mr-3 text-slate-500">Gốc: {formatPrice(item.product?.basePrice || 0)} đ</span>
                                                <span className="font-semibold text-rose-600">Bán: {formatPrice(item.product?.salePrice || 0)} đ</span>
                                            </div>
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
                                                {formatPrice((item.product?.salePrice || 0) * (Number(item.quantity) || 0))} đ
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
                            <div className="flex justify-between text-xs text-slate-500">
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
                                <span>Tiền COD:</span>
                                <span>{formatPrice(codAmount)} đ</span>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full flex items-center gap-2"
                                onClick={() => setIsBillOpen(true)}
                                disabled={orderItems.length === 0}
                            >
                                <FileText className="w-4 h-4" />
                                XUẤT HÓA ĐƠN (XEM TRƯỚC)
                            </Button>
                            <Button type="submit" className="w-full text-lg h-12" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang tạo đơn...' : 'HOÀN TẤT TẠO ĐƠN'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Dialog must be OUTSIDE the form to avoid triggering form submit */}
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo Sản Phẩm Mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-name">Tên sản phẩm *</Label>
                            <Input
                                id="new-name"
                                value={newProductForm.name}
                                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-base-price">Giá gốc (VNĐ)</Label>
                                <Input
                                    id="new-base-price"
                                    type="number"
                                    min="0"
                                    value={newProductForm.basePrice}
                                    onChange={(e) => setNewProductForm({ ...newProductForm, basePrice: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-sale-price">Giá bán (VNĐ) *</Label>
                                <Input
                                    id="new-sale-price"
                                    type="number"
                                    min="0"
                                    value={newProductForm.salePrice}
                                    onChange={(e) => setNewProductForm({ ...newProductForm, salePrice: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-image2">Ảnh sản phẩm</Label>
                            <Input
                                id="new-image2"
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

            {/* Bill Preview Dialog */}
            <Dialog open={isBillOpen} onOpenChange={setIsBillOpen}>
                <DialogContent className="invoice-print-shell max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="invoice-print-header">
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-rose-500" />
                            Hóa Đơn Bán Hàng
                        </DialogTitle>
                    </DialogHeader>
                    <div id="bill-content" className="invoice-print-card p-6 bg-white border rounded-lg space-y-6 text-slate-800">
                        <div className="text-center border-b pb-4">
                            <h2 className="text-2xl font-bold uppercase tracking-wider">Hóa Đơn Thanh Toán</h2>
                            <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('vi-VN')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Khách hàng</p>
                                <p className="font-semibold text-base">{customerName || 'Chưa nhập tên'}</p>
                                {!isOldCustomer && (
                                    <>
                                        <p>{customerPhone}</p>
                                        <p className="text-xs text-slate-500 mt-1 italic">{customerAddress}</p>
                                    </>
                                )}
                                    {isOldCustomer && null}
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
                                    {orderItems.map((item, idx) => (
                                        <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50">
                                            <td className="py-1 px-2 font-medium leading-tight">{item.product?.name}</td>
                                            <td className="py-1 px-2 text-center">{item.quantity}</td>
                                            <td className="py-1 px-2 text-right">{formatPrice(item.product?.salePrice || 0)}</td>
                                            <td className="py-1 px-2 text-right font-semibold">
                                                {formatPrice((item.product?.salePrice || 0) * (Number(item.quantity) || 0))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-1 pt-1.5 border-t text-[12px]">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Tổng tiền hàng:</span>
                                <span>{formatPrice(calculateItemsTotal())}&nbsp;đ</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500">
                                <span className="text-slate-500">Phí vận chuyển:</span>
                                <span>{formatPrice(shippingFee)}&nbsp;đ</span>
                            </div>
                            <div className="flex justify-between text-base font-bold border-t pt-1.5 mt-1.5">
                                <span>Tổng tiền hàng:</span>
                                <span className="text-rose-600">{formatPrice(calculateItemsTotal())}&nbsp;đ</span>
                            </div>
                            {hasDeposit === 'yes' && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Đã đặt cọc:</span>
                                    <span>- {formatPrice(Number(depositAmount || 0))}&nbsp;đ</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold bg-rose-50 p-1.5 rounded mt-1">
                                <span>Tiền COD:</span>
                                <span className="text-rose-700">{formatPrice(codAmount)}&nbsp;đ</span>
                            </div>
                        </div>

                        <div className="text-center pt-6 italic text-slate-400 text-xs gap-1 flex flex-col">
                            <p>Cảm ơn quý khách đã tin tưởng và ủng hộ!</p>
                            <p>Vui lòng kiểm tra hàng kỹ trước khi thanh toán.</p>
                        </div>
                    </div>
                    <div className="invoice-print-actions flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsBillOpen(false)}>Đóng</Button>
                        <Button className="gap-2" onClick={handlePrintBill}>
                            <Printer className="w-4 h-4" />
                            In hóa đơn
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
