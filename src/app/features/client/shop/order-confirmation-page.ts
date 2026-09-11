import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { CartService } from '../../../shared/services/cart.service';
import { OrderService } from '../../../shared/services/order.service';
import { AuthSessionService } from '../../auth/auth-session.service';
import { CartItem } from '../../../shared/models/product';

@Component({
  selector: 'app-order-confirmation-page',
  imports: [ClientLayout, PageHeader, FormsModule],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="true">
      <app-page-header
        slot="header"
        title="Finaliser ma commande"
        backRoute="/client/boutique/panier"
      />

      <div class="order-confirm-page__content">
        <section class="order-confirm-page__hero">
          <div class="order-confirm-page__hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h1>Confirmez votre commande</h1>
          <p>
            Votre commande sera enregistrée <strong>en attente</strong>. Elle sera préparée
            dès que notre équipe l'aura confirmée (WhatsApp ou appel).
          </p>
        </section>

        <!-- Adresse de livraison -->
        <section class="order-confirm-page__card">
          <label class="order-confirm-page__field-label" for="delivery-address">Adresse de livraison</label>
          <input
            id="delivery-address"
            type="text"
            class="order-confirm-page__field"
            [(ngModel)]="deliveryAddress"
            placeholder="Ex : Sacré-Cœur 3, Villa 123, Dakar"
          />
          <label class="order-confirm-page__field-label" for="delivery-district">Quartier</label>
          <input
            id="delivery-district"
            type="text"
            class="order-confirm-page__field"
            [(ngModel)]="deliveryDistrict"
            placeholder="Ex : Sacré-Cœur"
          />
          @if (cartService.deliveryCoords()) {
            <span class="order-confirm-page__geo-hint">📍 Position GPS enregistrée pour la livraison</span>
          }
        </section>

        <section class="order-confirm-page__card">
          <div class="order-confirm-page__card-header">
            <span class="order-confirm-page__order-num">Récapitulatif</span>
            <span class="order-confirm-page__badge">En attente</span>
          </div>

          <div class="order-confirm-page__items">
            @for (item of items(); track item.product.id) {
              <div class="order-confirm-page__item-row">
                <img [src]="item.product.images[0]" [alt]="item.product.title" class="order-confirm-page__item-img" />
                <div class="order-confirm-page__item-info">
                  <strong>{{ item.product.title }}</strong>
                  <span>Quantité: {{ item.quantity }} &bull; {{ formatPrice(item.product.price * item.quantity) }} FCFA</span>
                </div>
              </div>
            }
          </div>

          <div class="order-confirm-page__divider"></div>

          <div class="order-confirm-page__total-row">
            <span>TOTAL À PAYER</span>
            <strong>{{ formatPrice(cartService.totalPrice()) }} FCFA</strong>
          </div>
        </section>

        @if (errorMsg()) {
          <p class="order-confirm-page__error">{{ errorMsg() }}</p>
        }
      </div>

      <div slot="footer" class="order-confirm-page__fixed-footer">
        <button type="button" class="order-confirm-page__whatsapp-btn" [disabled]="submitting()" (click)="orderByWhatsApp()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.82 14.1c-.25.7-1.46 1.34-2.02 1.4-.53.07-1.22.1-1.96-.14-.45-.15-1.03-.34-1.78-.67-3.14-1.36-5.18-4.54-5.34-4.75-.16-.21-1.29-1.72-1.29-3.28 0-1.56.82-2.33 1.11-2.65.29-.32.64-.4.85-.4.21 0 .42.01.6.01.2 0 .46-.07.72.55.26.63.89 2.17.97 2.32.08.16.13.35.03.56-.1.21-.16.34-.31.52-.16.18-.33.4-.47.54-.15.15-.31.31-.13.62.18.3.8 1.32 1.72 2.14 1.18 1.05 2.18 1.38 2.49 1.54.31.16.49.13.67-.08.18-.21.77-.9 1-.1.21.23.21.37.05.78.7.16.41.32.82.32 1.23 0 .41-.25.82-1.02.82z"/>
          </svg>
          <span>{{ submitting() ? 'Enregistrement…' : 'Commander sur WhatsApp' }}</span>
        </button>

        <button type="button" class="order-confirm-page__call-btn" [disabled]="submitting()" (click)="orderByCall()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 7.55 7.55l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>Appeler ({{ orderService.phoneNumber }})</span>
        </button>
      </div>
    </app-client-layout>
  `,
  styleUrl: './order-confirmation-page.scss'
})
export class OrderConfirmationPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly cartService = inject(CartService);
  protected readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthSessionService);

  protected readonly items = signal<readonly CartItem[]>([]);
  protected readonly submitting = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  protected deliveryAddress = '';
  protected deliveryDistrict = '';

  ngOnInit(): void {
    const cartItems = this.cartService.cartItems();
    if (cartItems.length === 0) {
      this.router.navigate(['/client/boutique']);
      return;
    }
    this.items.set([...cartItems]);
    this.deliveryAddress = this.cartService.deliveryAddress();
    this.deliveryDistrict = this.cartService.deliveryDistrict();
  }

  protected formatPrice(val: number): string {
    return val.toLocaleString('fr-FR');
  }

  private buildDelivery() {
    const user = this.auth.currentUser();
    const coords = this.cartService.deliveryCoords();
    const notes = coords ? `Position GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : undefined;
    return {
      address: this.deliveryAddress.trim() || undefined,
      district: this.deliveryDistrict.trim() || undefined,
      customerName: user && user.id !== 'guest' ? user.name : undefined,
      customerPhone: user && user.id !== 'guest' ? user.phone : undefined,
      notes
    };
  }

  private submit(channel: 'whatsapp' | 'call'): void {
    if (this.submitting() || this.items().length === 0) return;
    this.submitting.set(true);
    this.errorMsg.set(null);

    this.orderService.createOrder(
      this.items(),
      this.cartService.subtotal(),
      this.cartService.deliveryFee(),
      this.cartService.totalPrice(),
      channel,
      this.buildDelivery()
    ).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.cartService.clearCart();
        if (channel === 'whatsapp') {
          window.open(this.orderService.getNewOrderWhatsAppUrl(order), '_blank');
        } else {
          window.location.href = this.orderService.getCallUrl();
        }
        this.router.navigate(['/client/boutique/commandes']);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMsg.set('Impossible d\'enregistrer la commande. Vérifiez votre connexion et réessayez.');
      }
    });
  }

  protected orderByWhatsApp(): void {
    this.submit('whatsapp');
  }

  protected orderByCall(): void {
    this.submit('call');
  }
}
