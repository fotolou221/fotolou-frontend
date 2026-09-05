import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { TicketCard } from '../../../shared/components/ticket-card/ticket-card';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { TicketService } from '../../../shared/services/ticket.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { TicketTab } from '../../../shared/models/ticket';

@Component({
  selector: 'app-my-tickets-page',
  imports: [
    ClientLayout,
    LocationHeader,
    TicketCard,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <app-client-layout activeNav="tickets">
      <!-- Header Slot -->
      <app-location-header
        slot="header"
        [showLocation]="false"
        [hasNotification]="notificationService.unreadCount() > 0"
        (notificationClick)="goToNotifications()"
      />

      <!-- Content Body -->
      <div class="my-tickets-page__content">
        <!-- Segmented Tab Selector -->
        <div class="my-tickets-page__tabs">
          <button
            type="button"
            class="my-tickets-page__tab"
            [class.my-tickets-page__tab--active]="activeTab() === 'active'"
            (click)="selectTab('active')"
          >
            Actuel ({{ ticketService.activeCount() }})
          </button>
          <button
            type="button"
            class="my-tickets-page__tab"
            [class.my-tickets-page__tab--active]="activeTab() === 'history'"
            (click)="selectTab('history')"
          >
            Historique ({{ ticketService.historyCount() }})
          </button>
        </div>

        <!-- Loading Skeletons -->
        @if (ticketService.loading()) {
          <div class="my-tickets-page__list">
            <app-skeleton-loader type="ticket" [count]="3" />
          </div>
        } @else if (ticketService.error()) {
          <!-- Error State -->
          <app-error-state
            [message]="ticketService.error()!"
            (retry)="ticketService.loadTickets()"
          />
        } @else {
          <!-- Ticket Cards List -->
          <div class="my-tickets-page__list">
            @for (ticket of ticketService.displayedTickets(); track ticket.id) {
              <app-ticket-card [ticket]="ticket" />
            } @empty {
              @if (activeTab() === 'active') {
                <app-empty-state
                  icon="ticket"
                  title="Aucun ticket en cours"
                  description="Vous n'avez pas de ticket actif pour le moment. Trouvez un salon et rejoignez la file d'attente !"
                  actionLabel="Trouver un salon"
                  actionRoute="/client/home"
                />
              } @else {
                <app-empty-state
                  icon="ticket"
                  title="Aucun historique"
                  description="Vos anciens tickets terminés ou annulés apparaîtront ici."
                />
              }
            }
          </div>
        }
      </div>
    </app-client-layout>
  `,
  styleUrl: './my-tickets-page.scss'
})
export class MyTicketsPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly ticketService = inject(TicketService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly activeTab = this.ticketService.activeTab;

  ngOnInit(): void {
    this.ticketService.loadTickets();
  }

  protected selectTab(tab: TicketTab): void {
    this.ticketService.activeTab.set(tab);
  }

  protected goToNotifications(): void {
    this.router.navigate(['/client/notifications']);
  }
}
