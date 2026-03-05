'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Package, Pencil, Trash2, Search } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type Product = {
    id: string;
    name: string;
    description: string | null;
    basePrice: number;
    salePrice: number;
    imageUrl: string | null;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        basePrice: '',
        salePrice: '',
        imageUrl: '', // will be set after upload
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch {
            toast.error('Lỗi khi tải danh sách sản phẩm');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let uploadedUrl = '';
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append('file', imageFile);
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                });
                if (uploadRes.ok) {
                    const { url } = await uploadRes.json();
                    uploadedUrl = url;
                } else {
                    toast.error('Upload hình ảnh thất bại');
                    setIsLoading(false);
                    return;
                }
            }
            const payload = { ...formData, imageUrl: uploadedUrl || formData.imageUrl };
            const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
            const method = editingProduct ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast.success(editingProduct ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công');
                setIsOpen(false);
                setEditingProduct(null);
                setFormData({ name: '', description: '', basePrice: '', salePrice: '', imageUrl: '' });
                setImageFile(null);
                setImagePreview('');
                fetchProducts();
            } else {
                toast.error('Có lỗi xảy ra');
            }
        } catch {
            toast.error('Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            basePrice: product.basePrice.toString(),
            salePrice: product.salePrice.toString(),
            imageUrl: product.imageUrl || '',
        });
        setImagePreview(product.imageUrl || '');
        setImageFile(null); // Clear any previously selected file when editing
        setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Xóa sản phẩm thành công');
                fetchProducts();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Xóa thất bại');
            }
        } catch {
            toast.error('Lỗi khi xóa sản phẩm');
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Sản Phẩm</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Tìm tên sản phẩm..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Dialog open={isOpen} onOpenChange={(val) => {
                        setIsOpen(val);
                        if (!val) {
                            setEditingProduct(null);
                            setFormData({ name: '', description: '', basePrice: '', salePrice: '', imageUrl: '' });
                            setImageFile(null);
                            setImagePreview('');
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingProduct(null)}>Thêm Sản Phẩm</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên sản phẩm *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Mô tả</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="basePrice">Giá gốc (VNĐ)</Label>
                                        <Input
                                            id="basePrice"
                                            type="number"
                                            min="0"
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="salePrice">Giá bán (VNĐ) *</Label>
                                        <Input
                                            id="salePrice"
                                            type="number"
                                            min="0"
                                            value={formData.salePrice}
                                            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imageFile">Hình ảnh Sản Phẩm</Label>
                                    <Input
                                        id="imageFile"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setImageFile(file);
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setImagePreview(ev.target?.result as string);
                                                reader.readAsDataURL(file);
                                            } else {
                                                setImagePreview('');
                                            }
                                        }}
                                    />
                                    {(imagePreview || formData.imageUrl) && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imagePreview || formData.imageUrl || ''} alt="Preview" className="mt-2 max-h-40 object-cover" />
                                    )}
                                </div>
                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                        Hủy
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? 'Đang lưu...' : 'Lưu'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Unified Grid View */}
            {filteredProducts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg border text-gray-500">
                    {searchQuery ? 'Không tìm thấy sản phẩm nào khớp với từ khóa' : 'Chưa có sản phẩm nào'}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-slate-50 relative border-b border-slate-50 flex items-center justify-center overflow-hidden">
                                {product.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-300">
                                        <Package className="w-10 h-10 mb-2 opacity-50" strokeWidth={1.5} />
                                        <span className="text-[10px] uppercase tracking-wider font-medium opacity-50">No Image</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-semibold text-slate-800 line-clamp-1 text-sm md:text-base mb-1" title={product.name}>{product.name}</h3>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 mb-2">
                                    <div className="text-xs text-slate-500">
                                        Gốc: {formatPrice(product.basePrice)} đ
                                    </div>
                                    <div className="font-bold text-rose-600 opacity-90">
                                        {formatPrice(product.salePrice)} đ
                                    </div>
                                </div>
                                {product.description && (
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-auto leading-relaxed">{product.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
