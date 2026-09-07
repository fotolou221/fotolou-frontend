import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, finalize } from 'rxjs';
import { Order, OrderStatus, OrderType } from '../models/order';
import { CartItem } from '../models/product';
import { API_CONFIG } from '../../core/config/api.config';
import { AuthSessionService } from '../../features/auth/auth-session.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthSessionService);
  private readonly baseUrl = API_CONFIG.baseUrl;

  // ── State Signals ───────────────────────────────────────────
  readonly orders = signal<readonly Order[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ── Cache Strategy (SWR - 2 min TTL) ────────────────────────
  private lastFetchedAt: number | null = null;
  private readonly CACHE_TTL_MS = 2 * 60 * 1000;

  readonly phoneNumber = '+221 77 862 70 52';
  readonly whatsappPhone = '221778627052';

  // ── Computed Lists ──────────────────────────────────────────
  readonly activeOrders = computed(() =>
    this.orders().filter((o) => o.status === 'en_cours')
  );

  readonly historyOrders = computed(() =>
    this.orders().filter((o) => o.status === 'livre' || o.status === 'annule')
  );

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user && user.id !== 'guest') {
        this.loadOrders(true);
      } else {
        this.orders.set([]);
        this.lastFetchedAt = null;
        this.loading.set(false);
        this.isRefreshing.set(false);
        this.error.set(null);
      }
    });
  }

  loadOrders(forceRefresh: boolean = false): void {
    const user = this.auth.currentUser();
    if (!user || user.id === 'guest') {
      this.orders.set([]);
      this.lastFetchedAt = null;
      this.loading.set(false);
      this.isRefreshing.set(false);
      return;
    }

    const now = Date.now();
    const hasData = this.orders().length > 0;
    const isCacheValid = this.lastFetchedAt !== null && (now - this.lastFetchedAt) < this.CACHE_TTL_MS;

    if (hasData && isCacheValid && !forceRefresh) {
      return;
    }

    if (hasData) {
      this.isRefreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    this.http.get<any[]>(`${this.baseUrl}${API_CONFIG.endpoints.orders}`).pipe(
      map((data) =>
        (Array.isArray(data) ? data : []).map((o) => ({
          ...o,
          id: o.id ? o.id.toString() : `ord-${Date.now()}`,
          orderNumber: o.orderNumber || 'CMD-2026-001',
          status: (o.status ? o.status.toLowerCase() : 'en_cours') as OrderStatus,
          orderType: (o.orderType ? o.orderType.toLowerCase() : 'whatsapp') as OrderType,
          items: Array.isArray(o.items)
            ? o.items
            : Array.isArray(o.itemses)
              ? o.itemses.map((it: any) => ({
                  product: it.product || { id: it.productId?.toString(), title: it.productTitle, price: it.unitPrice },
                  quantity: it.quantity
                }))
              : [],
          subtotal: Number(o.subtotal) || 0,
          deliveryFee: Number(o.deliveryFee) || 2000,
          totalPrice: Number(o.totalPrice) || 0,
          createdAt: o.createdAt || o.createdDate || new Date().toISOString()
        }))
      ),
      tap((data) => {
        this.orders.set(data);
        this.lastFetchedAt = Date.now();
      }),
      catchError((err) => {
        console.error('[OrderService] Error fetching orders:', err);
        if (!hasData) {
          this.error.set('Impossible de charger vos commandes.');
        }
        return of([]);
      }),
      finalize(() => {
        this.loading.set(false);
        this.isRefreshing.set(false);
      })
    ).subscribe();
  }

  getOrderById(id: string | null): Observable<Order | null> {
    if (!id) return of(null);
    return this.http.get<any>(`${this.baseUrl}${API_CONFIG.endpoints.orders}/${id}`).pipe(
      map((o) => ({
        ...o,
        id: o.id ? o.id.toString() : id,
        orderNumber: o.orderNumber || 'CMD-2026-001',
        status: (o.status ? o.status.toLowerCase() : 'en_cours') as OrderStatus,
        orderType: (o.orderType ? o.orderType.toLowerCase() : 'whatsapp') as OrderType,
        items: Array.isArray(o.items) ? o.items : [],
        subtotal: Number(o.subtotal) || 0,
        deliveryFee: Number(o.deliveryFee) || 2000,
        totalPrice: Number(o.totalPrice) || 0,
        createdAt: o.createdAt || o.createdDate || new Date().toISOString()
      })),
      catchError((err) => {
        console.error(`[OrderService] Error fetching order ${id}:`, err);
        return of(this.orders().find((o) => o.id === id) || null);
      })
    );
  }

  createOrder(
    items: readonly CartItem[],
    subtotal: number,
    deliveryFee: number,
    totalPrice: number,
    orderType: OrderType
  ): Observable<Order> {
    const nextSeq = this.orders().length + 13;
    const orderNum = `CMD-2026-${nextSeq.toString().padStart(3, '0')}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      items: items.map((i) => ({
        product: { ...i.product },
        quantity: i.quantity
      })),
      subtotal,
      deliveryFee,
      totalPrice,
      status: 'en_cours',
      orderType,
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    this.orders.update((prev) => [newOrder, ...prev]);

    return this.http.post<any>(`${this.baseUrl}/orders/checkout`, {
      items: items.map((i) => ({ productId: Number(i.product.id) || 1, quantity: i.quantity })),
      deliveryAddress: 'Dakar, Sénégal',
      deliveryDistrict: 'Dakar',
      orderType: orderType.toUpperCase(),
      customerName: 'Client Fotolou'
    }).pipe(
      map((res) => ({
        ...newOrder,
        id: res.id ? res.id.toString() : newOrder.id,
        orderNumber: res.orderNumber || newOrder.orderNumber
      })),
      tap((savedOrder) => {
        this.orders.update((prev) =>
          prev.map((o) => (o.id === newOrder.id ? savedOrder : o))
        );
      }),
      catchError((err) => {
        console.warn('[OrderService] API post failed, keeping local order:', err);
        return of(newOrder);
      })
    );
  }

  getNewOrderWhatsAppUrl(order: Order): string {
    const itemListText = order.items
      .map((item) => `• ${item.product.title} (x${item.quantity}) - ${(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA`)
      .join('\n');

    const message = `Bonjour Fotolou ! 🛍️\nJe souhaite passer une nouvelle commande n° *${order.orderNumber}* :\n\n${itemListText}\n\n*Sous-total :* ${order.subtotal.toLocaleString('fr-FR')} FCFA\n*Livraison :* ${order.deliveryFee.toLocaleString('fr-FR')} FCFA\n*TOTAL :* ${order.totalPrice.toLocaleString('fr-FR')} FCFA\n\nMerci de me confirmer la prise en charge de ma commande !`;

    return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  getOrderTrackingWhatsAppUrl(order: Order): string {
    const statusText = order.status === 'en_cours' ? 'En cours de livraison' : order.status === 'livre' ? 'Livré' : 'Annulé';

    const message = `Bonjour Fotolou ! 📦\nJe souhaite faire le suivi de ma commande n° *${order.orderNumber}* (Statut : ${statusText}).\n\n*Montant total :* ${order.totalPrice.toLocaleString('fr-FR')} FCFA\n\nPourriez-vous m'informer de l'avancement de ma livraison s'il vous plaît ? Merci !`;

    return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  getCallUrl(): string {
    return `tel:+${this.whatsappPhone}`;
  }
}
