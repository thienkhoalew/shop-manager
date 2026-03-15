type DisplayItem = {
  salePrice: number;
  quantity: number;
};

type DisplayCodInput = {
  items: DisplayItem[];
  depositAmount?: number | null;
};

export function getDisplayProductTotal(items: DisplayItem[]): number {
  return items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
}

export function getDisplayCodTotal({ items, depositAmount }: DisplayCodInput): number {
  return Math.max(0, getDisplayProductTotal(items) - (depositAmount ?? 0));
}
