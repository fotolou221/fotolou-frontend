import { CartItem } from './product';

export type OrderStatus = 'en_attente' | 'en_cours' | 'livre' | 'annule';
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
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly deliveryAddress?: string;
  readonly deliveryDistrict?: string;
  readonly notes?: string;
  /** Lien WhatsApp pré-rempli renvoyé par le backend au moment du checkout. */
  readonly whatsAppUrl?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  livre: 'Livrée',
  annule: 'Annulée'
};
