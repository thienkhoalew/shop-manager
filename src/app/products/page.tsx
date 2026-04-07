'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Package, Pencil, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { formatPrice } from '@/lib/utils';

type Product = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  salePrice: number;
  imageUrl: string | null;
};

const emptyForm = {
  name: '',
  description: '',
  basePrice: '',
  salePrice: '',
  imageUrl: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void fetchProducts();
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

  const resetForm = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview('');
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
        resetForm();
        void fetchProducts();
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
    setImageFile(null);
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
        void fetchProducts();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Xóa thất bại');
      }
    } catch {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <Dialog
        open={isOpen}
        onOpenChange={(val) => {
          setIsOpen(val);
          if (!val) resetForm();
        }}
      >
        <section className="page-hero px-5 py-6 sm:px-6 md:px-8">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="section-kicker">Danh mục bán hàng</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-foreground sm:text-4xl">
                Sản phẩm
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <div className="stat-tile p-4">
                <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">
                  {products.length}
                </p>
              </div>
              <div className="stat-tile p-4">
                <p className="text-sm text-muted-foreground">Đang hiển thị</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-primary">
                  {filteredProducts.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-panel px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 sm:w-80">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên sản phẩm..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto" onClick={() => setEditingProduct(null)}>
                  Thêm sản phẩm
                </Button>
              </DialogTrigger>
            </div>
          </div>
        </section>

        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-[-0.05em]">
              {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <Label htmlFor="imageFile">Hình ảnh sản phẩm</Label>
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
                <div className="relative mt-3 h-52 overflow-hidden rounded-[1.5rem] border border-border/70 bg-secondary">
                  <Image
                    src={imagePreview || formData.imageUrl || ''}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {filteredProducts.length === 0 ? (
        <section className="surface-panel px-5 py-10 text-center sm:px-6">
          <p className="eyebrow">Danh mục trống</p>
          <p className="mt-3 text-lg font-medium text-foreground">
            {searchQuery ? 'Không tìm thấy sản phẩm phù hợp từ khóa.' : 'Chưa có sản phẩm nào trong danh mục.'}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {searchQuery
              ? 'Thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc để xem lại toàn bộ sản phẩm.'
              : 'Bạn có thể thêm sản phẩm mới ngay từ nút ở phía trên.'}
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="surface-panel group overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="relative aspect-[0.92] overflow-hidden rounded-t-[1.65rem] bg-[linear-gradient(180deg,rgba(255,247,234,0.96),rgba(243,236,224,0.88))]">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <Package className="mb-3 h-10 w-10 opacity-60" strokeWidth={1.5} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
                      No image
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow">Sản phẩm</p>
                    <h2
                      className="mt-2 line-clamp-2 text-base font-semibold leading-6 tracking-[-0.03em] text-foreground"
                      title={product.name}
                    >
                      {product.name}
                    </h2>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => handleEdit(product)}
                      className="rounded-xl border border-border/80 bg-white p-2 text-slate-500 transition hover:border-primary/20 hover:text-primary"
                      title="Sửa sản phẩm"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="rounded-xl border border-border/80 bg-white p-2 text-slate-500 transition hover:border-red-200 hover:text-red-500"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,251,244,0.98),rgba(255,238,215,0.9))] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Giá bán</p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-primary">
                    {formatPrice(product.salePrice)} đ
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Giá gốc {formatPrice(product.basePrice)} đ
                  </p>
                </div>

                {product.description && (
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {product.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
