export interface ProductCategory {
  readonly id: string;
  readonly name: string;
  readonly image: string;
}

export interface Product {
  readonly id: string;
  readonly brand: string;
  readonly title: string;
  readonly description: string;
  readonly price: number; // in FCFA
  readonly oldPrice?: number; // in FCFA
  readonly rating: number; // e.g. 4.9
  readonly images: readonly string[];
  readonly categoryId: string;
  readonly inStock: boolean;
}

export interface CartItem {
  readonly product: Product;
  quantity: number;
}
