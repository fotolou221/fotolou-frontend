import { Injectable, signal, computed, effect } from '@angular/core';
import { Product, CartItem } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'fotolou_cart_items';

  readonly cartItems = signal<readonly CartItem[]>(this.readInitialCart());
  readonly deliveryFee = signal(2000);
  readonly discount = signal(0);

  readonly cartCount = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
  });

  readonly subtotal = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  });

  readonly totalPrice = computed(() => {
    return Math.max(0, this.subtotal() + this.deliveryFee() - this.discount());
  });

  constructor() {
    effect(() => {
      const items = this.cartItems();
      try {
        globalThis.localStorage?.setItem(this.STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.warn('[CartService] Error saving cart to localStorage:', err);
      }
    });
  }

  addToCart(product: Product, quantity = 1): void {
    this.cartItems.update((items) => {
      const existingIndex = items.findIndex((i) => i.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }
      return [...items, { product, quantity }];
    });
  }

  updateQuantity(productId: string, delta: number): void {
    this.cartItems.update((items) => {
      return items
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  }

  removeFromCart(productId: string): void {
    this.cartItems.update((items) => items.filter((i) => i.product.id !== productId));
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  private readInitialCart(): CartItem[] {
    try {
      const saved = globalThis.localStorage?.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  }
}
