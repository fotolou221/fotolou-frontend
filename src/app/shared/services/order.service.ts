import { Injectable, inject, signal, computed, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, finalize } from 'rxjs';
import { Order, OrderStatus, OrderType } from '../models/order';
import { CartItem, Product } from '../models/product';
import { API_CONFIG } from '../../core/config/api.config';
import { AuthSessionService } from '../../features/auth/auth-session.service';
import { HttpErrorMessageService } from './http-error-message.service';
import { ProductService } from './product.service';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthSessionService);
  private readonly errorMessages = inject(HttpErrorMessageService);
  private readonly productService = inject(ProductService);
  private readonly baseUrl = API_CONFIG.baseUrl;

  // ── State Signals ───────────────────────────────────────────
  readonly orders = signal<readonly Order[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private lastFetchedAt: number | null = null;
  private readonly CACHE_TTL_MS = 60 * 1000;
  private requestInFlight = false;

  readonly phoneNumber = '+221 77 862 70 52';
  readonly whatsappPhone = '221778627052';

  // ── Computed Lists ──────────────────────────────────────────
  readonly activeOrders = computed(() =>
    this.orders().filter((o) => o.status === 'en_attente' || o.status === 'en_cours')
  );

  readonly historyOrders = computed(() =>
    this.orders().filter((o) => o.status === 'livre' || o.status === 'annule')
  );

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('fotolou_jwt_token');
      untracked(() => {
        if (user && user.id !== 'guest' && hasToken) {
          this.loadOrders(true);
        } else {
          this.orders.set([]);
          this.lastFetchedAt = null;
          this.requestInFlight = false;
          this.loading.set(false);
          this.isRefreshing.set(false);
          this.error.set(null);
        }
      });
    });
  }

  // ── Mapping API -> modèle ──────────────────────────────────
  private resolveProduct(productId: string, title: string, price: number): Product {
    const found = this.productService.products().find((p) => p.id === productId);
    if (found) {
      return found;
    }
    return {
      id: productId,
      brand: 'Fotolou',
      title: title || 'Produit',
      description: '',
      price,
      rating: 5,
      images: [FALLBACK_IMG],
      categoryId: '',
      inStock: true
    };
  }

  private mapApiOrder(o: any): Order {
    const lines: any[] = Array.isArray(o.items)
      ? o.items
      : Array.isArray(o.itemses)
        ? o.itemses
        : [];

    const items: CartItem[] = lines.map((it: any) => {
      const productId = (it.productId ?? it.product?.id ?? '').toString();
      const title = it.productTitle || it.product?.title || 'Produit';
      const unitPrice = Number(it.unitPrice ?? it.product?.price ?? 0);
      return {
        product: this.resolveProduct(productId, title, unitPrice),
        quantity: Number(it.quantity) || 1
      };
    });

    return {
      id: o.id ? o.id.toString() : `ord-${Date.now()}`,
      orderNumber: o.orderNumber || 'CMD-2026-000',
      status: (o.status ? o.status.toLowerCase() : 'en_attente') as OrderStatus,
      orderType: (o.orderType ? o.orderType.toLowerCase() : 'whatsapp') as OrderType,
      items,
      subtotal: Number(o.subtotal) || 0,
      deliveryFee: Number(o.deliveryFee) || 0,
      totalPrice: Number(o.totalPrice) || 0,
      createdAt: o.createdAt || o.createdDate || new Date().toISOString(),
      customerName: o.customerName || undefined,
      customerPhone: o.customerPhone || undefined,
      deliveryAddress: o.deliveryAddress || undefined,
      deliveryDistrict: o.deliveryDistrict || undefined,
      whatsAppUrl: o.whatsAppUrl || undefined
    };
  }

  loadOrders(forceRefresh: boolean = false): void {
    const user = this.auth.currentUser();
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('fotolou_jwt_token');
    if (!user || user.id === 'guest' || !hasToken) {
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
    if (this.requestInFlight) {
      return;
    }

    if (hasData) {
      this.isRefreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);
    this.requestInFlight = true;

    this.http.get<any[]>(`${this.baseUrl}/orders/my-orders`).pipe(
      map((data) => (Array.isArray(data) ? data : []).map((o) => this.mapApiOrder(o))),
      tap((data) => {
        this.orders.set(data);
        this.lastFetchedAt = Date.now();
      }),
      catchError((err) => {
        if (err?.status === 401) {
          // Utilisateur non authentifié ou session expirée
          this.orders.set([]);
          return of([]);
        }
        console.error('[OrderService] Error fetching orders:', err);
        this.error.set(this.errorMessages.message(err, 'Impossible de charger vos commandes. Verifiez votre connexion.'));
        return of([]);
      }),
      finalize(() => {
        this.requestInFlight = false;
        this.loading.set(false);
        this.isRefreshing.set(false);
      })
    ).subscribe();
  }

  getOrderById(id: string | null): Observable<Order | null> {
    if (!id) return of(null);
    const local = this.orders().find((o) => o.id === id);
    if (local) {
      return of(local);
    }
    // fallback : recharger la liste et y chercher
    return this.http.get<any[]>(`${this.baseUrl}/orders/my-orders`).pipe(
      map((data) => (Array.isArray(data) ? data : []).map((o) => this.mapApiOrder(o))),
      tap((data) => this.orders.set(data)),
      map((data) => data.find((o) => o.id === id) || null),
      catchError((err) => {
        console.error(`[OrderService] Error fetching order ${id}:`, err);
        this.error.set(this.errorMessages.message(err, 'Impossible de charger cette commande.'));
        return of(this.orders().find((o) => o.id === id) || null);
      })
    );
  }

  /**
   * Crée la commande côté backend en statut EN_ATTENTE.
   * La commande n'est PAS validée : elle attend une confirmation (WhatsApp ou admin).
   */
  createOrder(
    items: readonly CartItem[],
    subtotal: number,
    deliveryFee: number,
    totalPrice: number,
    orderType: OrderType,
    delivery?: { address?: string; district?: string; customerName?: string; customerPhone?: string; notes?: string }
  ): Observable<Order> {
    const payload = {
      items: items.map((i) => ({ productId: Number(i.product.id) || 0, quantity: i.quantity })),
      deliveryAddress: delivery?.address || null,
      deliveryDistrict: delivery?.district || null,
      orderType: orderType.toUpperCase(),
      customerName: delivery?.customerName || null,
      customerPhone: delivery?.customerPhone || null,
      notes: delivery?.notes || null
    };

    return this.http.post<any>(`${this.baseUrl}/orders/checkout`, payload).pipe(
      map((res) => {
        const dto = res.order || res;
        const mapped = this.mapApiOrder({
          ...dto,
          whatsAppUrl: res.whatsAppUrl || dto.whatsAppUrl,
          subtotal: dto.subtotal ?? subtotal,
          deliveryFee: dto.deliveryFee ?? deliveryFee,
          totalPrice: dto.totalPrice ?? totalPrice,
          items: dto.items && dto.items.length ? dto.items : items.map((i) => ({
            productId: i.product.id,
            productTitle: i.product.title,
            unitPrice: i.product.price,
            quantity: i.quantity
          }))
        });
        this.orders.update((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)]);
        this.lastFetchedAt = null;
        return mapped;
      }),
      catchError((err) => {
        console.error('[OrderService] Checkout failed:', err);
        this.error.set(this.errorMessages.message(err, 'Impossible d\'enregistrer la commande. Verifiez votre reseau.'));
        throw err;
      })
    );
  }

  /** Confirme la commande (appelé quand le client part sur WhatsApp / appel). */
  confirmOrder(orderId: string): Observable<Order | null> {
    return this.http.post<any>(`${this.baseUrl}/orders/${orderId}/confirm`, {}).pipe(
      map((dto) => {
        const mapped = this.mapApiOrder(dto);
        this.orders.update((prev) => prev.map((o) => (o.id === mapped.id ? mapped : o)));
        return mapped;
      }),
      catchError((err) => {
        console.warn('[OrderService] confirmOrder failed:', err);
        return of(null);
      })
    );
  }

  getNewOrderWhatsAppUrl(order: Order): string {
    if (order.whatsAppUrl) {
      return order.whatsAppUrl;
    }
    const itemListText = order.items
      .map((item) => `• ${item.product.title} (x${item.quantity}) - ${(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA`)
      .join('\n');

    const message = `Bonjour Fotolou ! 🛍️\nJe souhaite confirmer ma commande n° *${order.orderNumber}* :\n\n${itemListText}\n\n*Sous-total :* ${order.subtotal.toLocaleString('fr-FR')} FCFA\n*Livraison :* ${order.deliveryFee.toLocaleString('fr-FR')} FCFA\n*TOTAL :* ${order.totalPrice.toLocaleString('fr-FR')} FCFA\n\nMerci de me confirmer la prise en charge de ma commande !`;
    return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  getOrderTrackingWhatsAppUrl(order: Order): string {
    const statusText =
      order.status === 'en_attente'
        ? 'En attente de confirmation'
        : order.status === 'en_cours'
          ? 'En cours de livraison'
          : order.status === 'livre'
            ? 'Livré'
            : 'Annulé';

    const message = `Bonjour Fotolou ! 📦\nJe souhaite faire le suivi de ma commande n° *${order.orderNumber}* (Statut : ${statusText}).\n\n*Montant total :* ${order.totalPrice.toLocaleString('fr-FR')} FCFA\n\nPourriez-vous m'informer de l'avancement s'il vous plaît ? Merci !`;
    return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  getCallUrl(): string {
    return `tel:+${this.whatsappPhone}`;
  }
}
