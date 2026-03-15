type SearchableProduct = {
  id: string;
  name: string;
};

type ProductSearchInput<TProduct extends SearchableProduct> = {
  products: TProduct[];
  query: string;
  selectedProductIds: string[];
};

export function getProductSearchResults<TProduct extends SearchableProduct>({
  products,
  query,
  selectedProductIds,
}: ProductSearchInput<TProduct>): TProduct[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const selectedIds = new Set(selectedProductIds);

  return products.filter((product) => {
    return !selectedIds.has(product.id) && product.name.toLowerCase().includes(normalizedQuery);
  });
}
