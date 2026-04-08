export type ProductCatalogEntry = {
  id: string;
  name: string;
  basePrice: number;
  salePrice: number;
};

export type ParsedOrderItem = {
  productId: string | null;
  productName: string;
  quantity: number;
  note: string | null;
};

export type DepositStatus = "no_deposit" | "partial_deposit" | "full_deposit";

export type ParsedOrderDraft = {
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  shippingFee: number | null;
  depositStatus: DepositStatus;
  depositAmount: number | null;
  isOldCustomer: boolean | null;
  items: ParsedOrderItem[];
  notes: string[];
};

export function normalizeOrderSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findBestProductMatch<TProduct extends ProductCatalogEntry>(
  products: TProduct[],
  productId: string | null,
  productName: string
) {
  if (productId) {
    const exactById = products.find((product) => product.id === productId);
    if (exactById) {
      return exactById;
    }
  }

  const normalizedName = normalizeOrderSearchText(productName);
  if (!normalizedName) {
    return null;
  }

  const exactByName = products.find(
    (product) => normalizeOrderSearchText(product.name) === normalizedName
  );
  if (exactByName) {
    return exactByName;
  }

  const includedMatch = products.find((product) => {
    const normalizedProductName = normalizeOrderSearchText(product.name);
    return (
      normalizedProductName.includes(normalizedName) ||
      normalizedName.includes(normalizedProductName)
    );
  });

  return includedMatch ?? null;
}
