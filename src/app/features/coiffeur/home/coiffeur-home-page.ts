import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { SearchBar } from '../../../shared/components/search-bar/search-bar';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { TicketService } from '../../../shared/services/ticket.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { SalonService } from '../../../shared/services/salon.service';
import { AuthSessionService } from '../../auth/auth-session.service';
import { Ticket, compareTicketQueueOrder } from '../../../shared/models/ticket';

@Component({
  selector: 'app-coiffeur-home-page',
  imports: [ClientLayout, LocationHeader, SearchBar, EmptyStateComponent],
  template: `
    <app-client-layout activeNav="home" role="coiffeur" [hasHeaderSlot]="true">
      <app-location-header
        slot="header"
        [showLocation]="false"
        [hasNotification]="notificationService.coiffeurUnreadCount() > 0"
        (notificationClick)="goToNotifications()"
      />

      <main class="coiffeur-home">
        <section class="coiffeur-home__greeting" aria-label="Accueil coiffeur">
          <div class="coiffeur-home__greeting-header">
            <h1 class="coiffeur-home__title">
              Bonjour, <span class="coiffeur-home__user-name">{{ greetingName() }}</span>
              <span class="coiffeur-home__wave" aria-hidden="true">👋</span>
            </h1>
            <button
              type="button"
              class="coiffeur-home__salon-toggle"
              [class.coiffeur-home__salon-toggle--closed]="!isQueueOpen()"
              [disabled]="!currentSalon() || queueBusy()"
              [attr.aria-pressed]="isQueueOpen()"
              [attr.aria-label]="isQueueOpen() ? 'Fermer le salon' : 'Ouvrir le salon'"
              (click)="toggleQueue()"
            >
              <span class="coiffeur-home__salon-label">
                @if (queueBusy()) {
                  Mise à jour<span class="loading-dots" aria-hidden="true"></span>
                } @else {
                  {{ isQueueOpen() ? 'Ouvert' : 'Fermé' }}
                }
              </span>
              <span class="coiffeur-home__salon-switch" [class.coiffeur-home__salon-switch--on]="isQueueOpen()" aria-hidden="true">
                <span></span>
              </span>
            </button>
          </div>
          <p class="coiffeur-home__subtitle">{{ salonName() }}</p>
        </section>

        @if (queueError()) {
          <p class="coiffeur-home__queue-error" role="alert">{{ queueError() }}</p>
        }

        <section class="coiffeur-home__search">
          <app-search-bar
            [value]="searchQuery()"
            (valueChange)="onSearchChange($event)"
            placeholder="Rechercher un client ou un ticket"
          />
        </section>

        <section class="coiffeur-home__clients" aria-label="Liste des clients">
          <div class="coiffeur-home__section-title">
            <div>
              <h2>Clients dans la file</h2>
              <span>{{ clientsCountLabel() }}</span>
            </div>
            <button type="button" class="coiffeur-home__manage-btn" (click)="goToQueue()">Gérer</button>
          </div>

          @if (ticketService.loading() && activeTickets().length === 0) {
            <div class="coiffeur-home__loading">
              <span>Chargement des clients</span><span class="loading-dots" aria-hidden="true"></span>
            </div>
          } @else if (ticketService.error() && activeTickets().length === 0) {
            <div class="coiffeur-home__inline-error" role="alert">
              <span>{{ ticketService.error() }}</span>
              <button type="button" (click)="reloadTickets()">Réessayer</button>
            </div>
          } @else {
            <div class="coiffeur-home__client-list">
              @for (item of filteredClients(); track item.id) {
                <div
                  class="queue-card"
                  [class.queue-card--current]="isCurrentClient(item)"
                  [class.queue-card--waiting]="!isCurrentClient(item)"
                  (click)="goToQueue()"
                >
                  <div class="queue-card__top">
                    <div
                      class="queue-card__pos-box"
                      [class.queue-card__pos-box--current]="isCurrentClient(item)"
                    >
                      #{{ item.ticketNumber }}
                    </div>

                    <div class="queue-card__info">
                      <strong class="queue-card__name">{{ item.ownerName }}</strong>
                      <span class="queue-card__phone">{{ item.salonName }} &bull; Dakar</span>
                    </div>

                    <span
                      class="queue-card__status-tag"
                      [class.queue-card__status-tag--current]="isCurrentClient(item)"
                      [class.queue-card__status-tag--waiting]="!isCurrentClient(item)"
                    >
                      {{ isCurrentClient(item) ? 'En cours' : 'En attente' }}
                    </span>
                  </div>

                  <div class="queue-card__bottom">
                    @if (isCurrentClient(item)) {
                      <span class="queue-card__sub-badge queue-card__sub-badge--chair">
                        <span class="pulse-indicator"></span> Au fauteuil
                      </span>
                    } @else {
                      <span class="queue-card__sub-badge queue-card__sub-badge--waiting">
                        {{ getQueuePositionText(item) }}
                      </span>
                    }

                    <div class="queue-card__bottom-actions">
                      @if (getClientPhone(item)) {
                        <button
                          type="button"
                          class="queue-card__quick-call"
                          (click)="callClient($event, item)"
                          title="Appeler directement"
                          aria-label="Appeler le client"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          <span>Appeler</span>
                        </button>
                      }

                      <span class="queue-card__open-link">
                        Ouvrir
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              } @empty {
                <app-empty-state
                  [icon]="searchQuery() ? 'search' : 'ticket'"
                  [title]="searchQuery() ? 'Aucun client trouvé' : 'Aucun client en attente'"
                  [description]="searchQuery() ? 'Essayez un autre nom ou numéro de ticket.' : 'Les clients apparaîtront ici en temps réel.'"
                />
              }
            </div>
          }
        </section>
      </main>
    </app-client-layout>
  `,
  styleUrl: './coiffeur-home-page.scss'
})
export class CoiffeurHomePage {
  protected readonly router = inject(Router);
  protected readonly ticketService = inject(TicketService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly salonService = inject(SalonService);
  protected readonly authSession = inject(AuthSessionService);

  protected readonly queueBusy = signal(false);
  protected readonly queueError = signal<string | null>(null);
  protected readonly searchQuery = signal('');

  protected readonly currentSalon = computed(() => {
    const user = this.authSession.currentUser();
    const salonId = user?.salonId?.toString() || user?.salonSlug;
    if (salonId) {
      return (
        this.salonService.salons().find(
          (salon) => salon.id === salonId || salon.slug === salonId || salon.numericId?.toString() === salonId
        ) || null
      );
    }
    return this.salonService.salons()[0] || null;
  });

  protected readonly isQueueOpen = computed(() => this.currentSalon()?.status !== 'closed');

  protected readonly salonName = computed(() => this.currentSalon()?.name || 'Mon salon');

  protected readonly greetingName = computed(() => {
    const ownerName = this.ownerFirstName(this.currentSalon()?.ownerName || this.currentSalon()?.coiffeurName);
    if (ownerName) {
      return ownerName;
    }

    const user = this.authSession.activeUser();
    const name = user?.name?.trim();
    if (!name || user.id === 'guest' || name === 'Espace Barbier' || this.looksLikeSalonName(name)) {
      return 'Coiffeur';
    }
    return name.split(/\s+/)[0];
  });

  protected readonly activeTickets = computed(() =>
    [...this.ticketService.coiffeurActiveTickets()].sort(compareTicketQueueOrder)
  );

  protected readonly currentTicket = computed(() =>
    this.activeTickets().find((ticket) => ticket.status === 'your_turn') || this.activeTickets()[0] || null
  );

  protected readonly filteredClients = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.activeTickets();
    if (!query) {
      return list;
    }

    return list.filter((ticket) => {
      const ticketNumber = `#${ticket.ticketNumber}`.toLowerCase();
      return (
        ticket.ownerName.toLowerCase().includes(query) ||
        ticket.salonName.toLowerCase().includes(query) ||
        ticketNumber.includes(query) ||
        ticket.ticketNumber.toString().includes(query)
      );
    });
  });

  protected readonly clientsCountLabel = computed(() => {
    const total = this.activeTickets().length;
    const visible = this.filteredClients().length;
    if (this.searchQuery()) {
      return `${visible} résultat(s) sur ${total}`;
    }
    return `${total} client(s)`;
  });

  constructor() {
    this.salonService.loadSalons();
    this.ticketService.loadTickets();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected reloadTickets(): void {
    this.ticketService.loadTickets(true);
  }

  protected isCurrentClient(item: Ticket): boolean {
    return this.currentTicket()?.id === item.id;
  }

  protected getQueuePositionText(item: Ticket): string {
    const index = this.activeTickets().findIndex((ticket) => ticket.id === item.id);
    if (index <= 0) return 'Au fauteuil';
    return `${index + 1}e dans la file`;
  }

  protected toggleQueue(): void {
    const salon = this.currentSalon();
    if (!salon || this.queueBusy()) return;

    this.queueError.set(null);
    this.queueBusy.set(true);
    this.salonService
      .toggleSalonStatus(salon.numericId ?? salon.id)
      .pipe(finalize(() => this.queueBusy.set(false)))
      .subscribe({
        next: () => this.queueError.set(null),
        error: (err) => {
          this.queueError.set(err instanceof Error ? err.message : 'Impossible de modifier le statut de la boutique.');
        }
      });
  }

  protected goToQueue(): void {
    this.router.navigate(['/coiffeur/tickets']);
  }

  protected goToNotifications(): void {
    this.router.navigate(['/coiffeur/notifications']);
  }

  protected getClientPhone(item: Ticket): string {
    const raw = item.ownerPhone || (item.user && !item.user.login?.includes('@') ? item.user.login : '');
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('221') && digits.length > 9) {
      return `+${digits}`;
    }
    if (digits.length === 9) {
      return `+221${digits}`;
    }
    return raw.trim();
  }

  protected callClient(event: Event, item: Ticket): void {
    event.stopPropagation();
    const phone = this.getClientPhone(item);
    if (!phone) return;

    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
    this.ticketService.callTicket(item.id).subscribe();
  }

  private ownerFirstName(value?: string): string {
    const cleaned = value?.trim();
    if (!cleaned || this.looksLikeSalonName(cleaned)) {
      return '';
    }
    return cleaned.split(/\s+/)[0] || '';
  }

  private looksLikeSalonName(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    const salonName = this.currentSalon()?.name?.trim().toLowerCase();
    return (
      normalized === 'coiffeur propriétaire' ||
      normalized === 'coiffeur proprietaire' ||
      normalized === 'barbier fotolou' ||
      (!!salonName && (normalized === salonName || normalized === `${salonName} propriétaire` || normalized === `${salonName} proprietaire`))
    );
  }
}
