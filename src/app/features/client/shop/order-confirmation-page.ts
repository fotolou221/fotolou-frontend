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
            Votre commande sera enregistrée et préparée par l'équipe Fotolou.
          </p>
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
        <button
          type="button"
          class="order-confirm-page__validate-btn"
          [disabled]="submitting() || orderValidated()"
          (click)="validateOrder()"
        >
          @if (submitting()) {
            <div class="order-confirm-page__spinner"></div>
            <span>Validation en cours…</span>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Valider ma commande</span>
          }
        </button>
      </div>
    </app-client-layout>

    <!-- Modal Ticket Validé (style identique au ticket validé) -->
    @if (orderValidated()) {
      <div class="booking-modal__backdrop" role="presentation">
        <div class="booking-modal__card" role="dialog" aria-modal="true">
          <div class="booking-modal__success-state">
            <div class="booking-modal__success-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 class="booking-modal__success-title">Commande validée !</h3>
            <p class="booking-modal__success-desc">
              Votre commande {{ validatedOrderNumber() }} a été enregistrée avec succès.
            </p>
            <div class="booking-modal__success-progress">
              <div class="booking-modal__success-bar"></div>
            </div>
          </div>
        </div>
      </div>
    }
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
  protected readonly orderValidated = signal(false);
  protected readonly validatedOrderNumber = signal('');
  protected readonly errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    const cartItems = this.cartService.cartItems();
    if (cartItems.length === 0) {
      this.router.navigate(['/client/boutique']);
      return;
    }
    this.items.set([...cartItems]);

    // Active la géolocalisation pour enregistrer automatiquement la position du client
    if (!this.cartService.deliveryCoords() && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.cartService.deliveryCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }

  protected formatPrice(val: number): string {
    return val.toLocaleString('fr-FR');
  }

  private buildDelivery() {
    const user = this.auth.currentUser();
    const coords = this.cartService.deliveryCoords();
    const notes = coords
      ? `Position GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
      : undefined;
    return {
      address: undefined,
      district: 'Dakar',
      customerName: user && user.id !== 'guest' ? user.name : undefined,
      customerPhone: user && user.id !== 'guest' ? user.phone : undefined,
      notes
    };
  }

  protected async validateOrder(): Promise<void> {
    if (this.submitting() || this.items().length === 0 || this.orderValidated()) return;

    // Tente de récupérer les coordonnées en direct si pas encore capturées
    if (!this.cartService.deliveryCoords() && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 2500 });
        });
        this.cartService.deliveryCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        // En cas de refus ou timeout, on continue avec la position par défaut
      }
    }

    this.submitting.set(true);
    this.errorMsg.set(null);

    this.orderService.createOrder(
      this.items(),
      this.cartService.subtotal(),
      this.cartService.deliveryFee(),
      this.cartService.totalPrice(),
      'whatsapp',
      this.buildDelivery()
    ).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.cartService.clearCart();
        this.validatedOrderNumber.set(order.orderNumber ? `(${order.orderNumber})` : '');
        this.orderValidated.set(true);

        // Disparaît après 2s avec redirection vers la liste des commandes
        setTimeout(() => {
          this.router.navigate(['/client/boutique/commandes']);
        }, 2000);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMsg.set('Impossible d\'enregistrer la commande. Vérifiez votre connexion et réessayez.');
      }
    });
  }
}
