import { CartItem } from './product';

export type OrderStatus = 'en_cours' | 'livre' | 'annule';
export type OrderType = 'whatsapp' | 'call';

export interface Order {
  readonly id: string;
  readonly orderNumber: string; // e.g. CMD-2026-001
  readonly items: readonly CartItem[];
  readonly subtotal: number;
  readonly deliveryFee: number;
  readonly totalPrice: number;
  readonly status: OrderStatus;
  readonly orderType: OrderType;
  readonly createdAt: string;
}
