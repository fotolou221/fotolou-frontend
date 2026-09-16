import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { SearchBar } from '../../../shared/components/search-bar/search-bar';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { QrCode } from '../../../shared/components/qr-code/qr-code';
import { TicketService } from '../../../shared/services/ticket.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { SalonService } from '../../../shared/services/salon.service';
import { AuthSessionService } from '../../auth/auth-session.service';
import { Ticket, compareTicketQueueOrder } from '../../../shared/models/ticket';
import { buildSalonTicketUrl } from '../../../core/config/app-origin';

@Component({
  selector: 'app-coiffeur-home-page',
  imports: [ClientLayout, LocationHeader, SearchBar, EmptyStateComponent, QrCode],
  template: `
    <app-client-layout activeNav="home" role="coiffeur" [hasHeaderSlot]="true">
      <app-location-header
        slot="header"
        [showLocation]="false"
        [showFavorites]="false"
        [hasNotification]="notificationService.coiffeurUnreadCount() > 0"
        (notificationClick)="goToNotifications()"
      />

      <main class="coiffeur-home">
        <!-- Hero : photo du coiffeur, identité, statut du salon -->
        <section class="coiffeur-home__hero" aria-label="Profil coiffeur">
          <div class="coiffeur-home__hero-top">
            <div class="coiffeur-home__avatar">
              @if (avatarUrl() && !avatarBroken()) {
                <img [src]="avatarUrl()" [alt]="greetingName()" (error)="avatarBroken.set(true)" />
              } @else {
                <span>{{ avatarInitials() }}</span>
              }
            </div>

            <div class="coiffeur-home__identity">
              <h1 class="coiffeur-home__title">
                Bonjour, <span class="coiffeur-home__user-name">{{ greetingName() }}</span>
                <span class="coiffeur-home__wave" aria-hidden="true">👋</span>
              </h1>
              <p class="coiffeur-home__subtitle">{{ salonName() }}</p>
            </div>

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
        </section>

        @if (queueError()) {
          <p class="coiffeur-home__queue-error" role="alert">{{ queueError() }}</p>
        }

        <!-- Carte QR code du salon : accès rapide pour les clients -->
        @if (salonTicketUrl()) {
          <section class="qr-card" aria-label="QR code du salon">
            <div class="qr-card__body">
              <span class="qr-card__eyebrow">Ticket rapide</span>
              <h2 class="qr-card__title">Scannez pour prendre un ticket</h2>
              <p class="qr-card__desc">Vos clients scannent ce code et rejoignent la file instantanément.</p>

              <div class="qr-card__actions">
                <button type="button" class="qr-card__action" (click)="expandQr.set(true)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
                  </svg>
                  <span>Agrandir</span>
                </button>
              </div>
            </div>

            <button type="button" class="qr-card__qr-btn" (click)="expandQr.set(true)" (contextmenu)="$event.preventDefault()" aria-label="Agrandir le QR code du salon">
              <app-qr-code [value]="salonTicketUrl()" [size]="132" />
            </button>
          </section>
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
                    <div class="queue-card__avatar-wrap">
                      @if (item.ownerAvatarUrl) {
                        <img
                          [src]="item.ownerAvatarUrl"
                          [alt]="item.ownerName"
                          class="queue-card__avatar-img"
                          (error)="onAvatarError(item)"
                        />
                        <span
                          class="queue-card__avatar-num"
                          [class.queue-card__avatar-num--current]="isCurrentClient(item)"
                        >
                          #{{ item.ticketNumber }}
                        </span>
                      } @else {
                        <div
                          class="queue-card__pos-box"
                          [class.queue-card__pos-box--current]="isCurrentClient(item)"
                        >
                          #{{ item.ticketNumber }}
                        </div>
                      }
                    </div>

                    <div class="queue-card__info">
                      <strong class="queue-card__name">{{ item.ownerName }}</strong>
                      @if (getClientPhone(item)) {
                        <span class="queue-card__phone">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="queue-card__phone-icon" aria-hidden="true">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          {{ getClientPhone(item) }}
                        </span>
                      }
                      <div class="queue-card__meta-line">
                        <span class="queue-card__time">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="queue-card__time-icon" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Pris le {{ formatItemCreatedAt(item) }}
                        </span>
                      </div>
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

    <!-- QR code en grand : à montrer directement à un client pour un scan facile -->
    @if (expandQr() && salonTicketUrl()) {
      <div class="qr-overlay" role="dialog" aria-modal="true" aria-label="QR code du salon en grand" (click)="expandQr.set(false)">
        <div class="qr-overlay__card" (click)="$event.stopPropagation()">
          <button type="button" class="qr-overlay__close" (click)="expandQr.set(false)" aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="qr-overlay__qr" (contextmenu)="$event.preventDefault()">
            <app-qr-code [value]="salonTicketUrl()" [size]="232" />
          </div>

          <h3 class="qr-overlay__salon-name">{{ salonName() }}</h3>
          <p class="qr-overlay__hint">Scannez ce code pour prendre un ticket rapidement</p>
        </div>
      </div>
    }
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
  protected readonly avatarBroken = signal(false);
  protected readonly expandQr = signal(false);

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

  /** Lien de prise de ticket rapide encodé dans le QR (ordre d'arrivée, sans détour par la recherche). */
  protected readonly salonTicketUrl = computed(() => {
    const salon = this.currentSalon();
    const ref = salon?.slug || salon?.id;
    return ref ? buildSalonTicketUrl(ref) : '';
  });

  protected readonly avatarUrl = computed(() => {
    const user = this.authSession.currentUser();
    return user?.avatarUrl || this.currentSalon()?.avatarUrl || null;
  });

  protected readonly avatarInitials = computed(() => {
    const name = this.greetingName();
    return name.slice(0, 2).toUpperCase();
  });

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

  protected formatItemCreatedAt(item: Ticket): string {
    if (!item.createdAt) return '';
    const d = new Date(item.createdAt);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-SN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected getClientPhone(item: Ticket): string {
    const raw = item.ownerPhone || (item.user && !item.user.login?.includes('@') ? item.user.login : '');
    if (!raw) return '';
    return this.authSession.formatPhone(raw);
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

  protected onAvatarError(item: Ticket): void {
    (item as any).ownerAvatarUrl = undefined;
  }
}
