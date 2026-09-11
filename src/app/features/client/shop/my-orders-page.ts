import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { OrderService } from '../../../shared/services/order.service';
import { AuthSessionService } from '../../auth/auth-session.service';

type OrderTab = 'active' | 'history';

@Component({
  selector: 'app-my-orders-page',
  imports: [
    ClientLayout,
    PageHeader,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    RouterLink
  ],
  template: `
    <app-client-layout activeNav="profile" [hasHeaderSlot]="true">
      <!-- Fixed Header Slot -->
      <app-page-header
        slot="header"
        title="Mes commandes"
        [backRoute]="backRoute()"
      />

      <!-- Content -->
      <div class="my-orders-page__content">
        <!-- Tabs -->
        <div class="my-orders-page__tabs" role="tablist">
          <button
            type="button"
            class="my-orders-page__tab"
            [class.my-orders-page__tab--active]="activeTab() === 'active'"
            (click)="activeTab.set('active')"
            role="tab"
          >
            En cours ({{ orderService.activeOrders().length }})
          </button>

          <button
            type="button"
            class="my-orders-page__tab"
            [class.my-orders-page__tab--active]="activeTab() === 'history'"
            (click)="activeTab.set('history')"
            role="tab"
          >
            Historique ({{ orderService.historyOrders().length }})
          </button>
        </div>

        @if (orderService.loading()) {
          <div class="my-orders-page__list">
            <app-skeleton-loader type="card" [count]="3" />
          </div>
        } @else if (orderService.error()) {
          <app-error-state
            [message]="orderService.error()!"
            (retry)="orderService.loadOrders()"
          />
        } @else {
          <!-- Orders List -->
          <div class="my-orders-page__list">
            @for (order of displayedOrders(); track order.id) {
              <a [routerLink]="['/client/boutique/commandes', order.id]" class="order-card">
                <div class="order-card__header">
                  <div class="order-card__title-wrap">
                    <strong class="order-card__number">{{ order.orderNumber }}</strong>
                    <span class="order-card__date">{{ formatDate(order.createdAt) }} &bull; {{ order.items.length }} article(s)</span>
                  </div>

                  <span
                    class="order-card__badge"
                    [class.order-card__badge--pending]="order.status === 'en_attente'"
                    [class.order-card__badge--active]="order.status === 'en_cours'"
                    [class.order-card__badge--delivered]="order.status === 'livre'"
                    [class.order-card__badge--cancelled]="order.status === 'annule'"
                  >
                    {{ getStatusText(order.status) }}
                  </span>
                </div>

                <div class="order-card__divider"></div>

                <!-- Footer Total & Actions -->
                <div class="order-card__footer">
                  <div class="order-card__total-wrap">
                    <span class="order-card__total-label">TOTAL</span>
                    <strong class="order-card__total-val">{{ formatPrice(order.totalPrice) }} FCFA</strong>
                  </div>

                  <div class="order-card__actions">
                    <a
                      [href]="orderService.getOrderTrackingWhatsAppUrl(order)"
                      target="_blank"
                      class="order-card__wa-btn"
                      (click)="$event.stopPropagation()"
                      aria-label="Suivre sur WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.82 14.1c-.25.7-1.46 1.34-2.02 1.4-.53.07-1.22.1-1.96-.14-.45-.15-1.03-.34-1.78-.67-3.14-1.36-5.18-4.54-5.34-4.75-.16-.21-1.29-1.72-1.29-3.28 0-1.56.82-2.33 1.11-2.65.29-.32.64-.4.85-.4.21 0 .42.01.6.01.2 0 .46-.07.72.55.26.63.89 2.17.97 2.32.08.16.13.35.03.56-.1.21-.16.34-.31.52-.16.18-.33.4-.47.54-.15.15-.31.31-.13.62.18.3.8 1.32 1.72 2.14 1.18 1.05 2.18 1.38 2.49 1.54.31.16.49.13.67-.08.18-.21.77-.9 1-.1.21.23.21.37.05.78.7.16.41.32.82.32 1.23 0 .41-.25.82-1.02.82z"/>
                      </svg>
                      <span>Suivre</span>
                    </a>
                  </div>
                </div>
              </a>
            } @empty {
              <app-empty-state
                icon="box"
                title="Aucune commande trouvée"
                description="Vous n'avez pas encore passé de commande dans cette section."
                actionLabel="Découvrir la boutique"
                actionRoute="/client/boutique"
              />
            }
          </div>
        }
      </div>
    </app-client-layout>
  `,
  styleUrl: './my-orders-page.scss'
})
export class MyOrdersPage {
  protected readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthSessionService);

  protected readonly backRoute = computed(() =>
    this.auth.activeRole() === 'coiffeur' ? '/coiffeur/profile' : '/client/profile'
  );

  protected readonly activeTab = signal<OrderTab>('active');

  protected readonly displayedOrders = computed(() => {
    return this.activeTab() === 'active'
      ? this.orderService.activeOrders()
      : this.orderService.historyOrders();
  });

  protected formatPrice(val: number): string {
    return val.toLocaleString('fr-FR');
  }

  protected formatDate(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleDateString('fr-SN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected getStatusText(status: string): string {
    switch (status) {
      case 'en_attente':
        return 'EN ATTENTE';
      case 'en_cours':
        return 'EN COURS';
      case 'livre':
        return 'LIVRÉ';
      case 'annule':
        return 'ANNULÉ';
      default:
        return 'EN ATTENTE';
    }
  }
}
