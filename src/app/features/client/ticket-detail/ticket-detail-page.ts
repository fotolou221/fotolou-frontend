import { Component, effect, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { ConfirmModal } from '../../../shared/components/confirm-modal/confirm-modal';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { TicketService } from '../../../shared/services/ticket.service';
import { Ticket } from '../../../shared/models/ticket';
import { AuthSessionService } from '../../auth/auth-session.service';

@Component({
  selector: 'app-ticket-detail-page',
  imports: [
    ClientLayout,
    PageHeader,
    StatCard,
    StatusBadge,
    ConfirmModal,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    RouterLink
  ],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="true" [role]="isCoiffeur ? 'coiffeur' : 'client'">
      <!-- Fixed Top Header -->
      <app-page-header
        slot="header"
        title="Détail du Ticket"
        [backRoute]="backRoute"
      />

      <!-- Main Content -->
      @if (loading()) {
        <div class="ticket-detail-page__loading">
          <app-skeleton-loader type="card" [count]="2" />
        </div>
      } @else if (error() || !ticket) {
        <div class="ticket-detail-page__error">
          <app-error-state
            [message]="error() || 'Ticket introuvable.'"
            (retry)="loadTicket()"
          />
        </div>
      } @else {
        <div class="ticket-detail-page__content">
          <!-- Status & Title -->
          <section class="ticket-detail-page__hero">
            <span
              class="ticket-detail-page__status-tag"
              [class.ticket-detail-page__status-tag--completed]="isServed"
              [class.ticket-detail-page__status-tag--cancelled]="ticket.status === 'cancelled'"
            >
              {{ statusTagText }}
            </span>

            <h1>Ticket pour: {{ displayOwnerName }}</h1>
            <p class="ticket-detail-page__salon-line">{{ ticket.salonName }} &bull; Dakar</p>

            @if (formattedCreatedAt) {
              <div class="ticket-detail-page__timestamp-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ticket-detail-page__timestamp-icon" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Pris le {{ formattedCreatedAt }}</span>
              </div>
            }

            <!-- Circular Ring Progress -->
            <div class="ticket-detail-page__ring-container">
              <svg class="ticket-detail-page__ring-svg" viewBox="0 0 200 200">
                <!-- Background Track -->
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="var(--border-color, #e2e8f0)"
                  stroke-width="12"
                />
                <!-- Dynamic Ring Stroke -->
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  [attr.stroke]="ringColor"
                  stroke-width="12"
                  stroke-linecap="round"
                  stroke-dasharray="502"
                  [attr.stroke-dashoffset]="dashOffset"
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div class="ticket-detail-page__number-display">
                <span>{{ isCoiffeur ? 'Ticket N°' : 'Votre ticket' }}</span>
                <strong>{{ ticket.ticketNumber || '-' }}</strong>
              </div>
            </div>
          </section>

          <!-- Stats Row -->
          @if (!isHistory) {
            <section class="ticket-detail-page__stats">
              <app-stat-card label="NUMERO EN COURS">
                <div class="ticket-detail-page__current-num-wrap">
                  <span class="ticket-detail-page__current-num">{{ queueNumberDisplay }}</span>
                  @if (isCurrentTicketFromPreviousDay) {
                    <button
                      type="button"
                      class="ticket-detail-page__yesterday-badge"
                      [attr.aria-expanded]="queueBadgeInfoOpen()"
                      aria-describedby="queue-badge-info"
                      (click)="toggleQueueBadgeInfo($event)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>Pris avant vous</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="ticket-detail-page__yesterday-badge-info-icon">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </button>
                    @if (queueBadgeInfoOpen()) {
                      <div id="queue-badge-info" class="ticket-detail-page__badge-popover" role="status" (click)="$event.stopPropagation()">
                        Ce ticket a été pris avant le vôtre : la file suit l'ordre d'arrivée, pas le numéro du jour.
                      </div>
                    }
                  }
                </div>
              </app-stat-card>

              <app-stat-card label="STATUT">
                <app-status-badge [status]="salonStatus" />
              </app-stat-card>
            </section>
          }

          <!-- SMS / Info Card -->
          <section
            class="ticket-detail-page__sms-card"
            [class.ticket-detail-page__sms-card--completed]="isServed"
            [class.ticket-detail-page__sms-card--cancelled]="ticket.status === 'cancelled'"
          >
            <div class="ticket-detail-page__sms-icon" aria-hidden="true">
              @if (isHistory) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              }
            </div>
            <div class="ticket-detail-page__sms-content">
              @switch (ticket.status) {
                @case ('served') {
                  <p>Ce ticket a été <strong>servi avec succès</strong>. Merci d'utiliser Fotolou !</p>
                }
                @case ('completed') {
                  <p>Ce ticket a été <strong>servi avec succès</strong>. Merci d'utiliser Fotolou !</p>
                }
                @case ('cancelled') {
                  <p>Ce ticket a été <strong>annulé</strong>.</p>
                }
                @default {
                  @if (isCoiffeur) {
                    <p>Client : <strong>{{ ticket.ownerName }}</strong> - Téléphone : <strong>{{ targetSmsPhone || 'Non renseigné' }}</strong></p>
                  } @else if (targetSmsPhone) {
                    <p>Un SMS sera envoyé à <strong>{{ targetSmsPhone }}</strong> dès que votre tour approchera.</p>
                  } @else {
                    <p>Un SMS vous sera envoyé dès que votre tour approchera.</p>
                  }
                }
              }
              @if (isHistory) {
                @if (isServed && formattedServedAt) {
                  <span class="ticket-detail-page__served-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Servi le {{ formattedServedAt }}
                  </span>
                } @else if (formattedCancelledAt) {
                  <span class="ticket-detail-page__served-date ticket-detail-page__served-date--cancelled">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Annulé le {{ formattedCancelledAt }}
                  </span>
                }
              }
            </div>
          </section>
        </div>
      }

      <!-- Fixed Bottom Action Bar -->
      @if (ticket && !loading()) {
        <div slot="footer" class="ticket-detail-page__fixed-footer">
          @if (isCoiffeur) {
            <a routerLink="/coiffeur/tickets" class="ticket-detail-page__new-ticket-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              <span>Retour à l'historique</span>
            </a>
          } @else if (isHistory) {
            <a routerLink="/client/home" class="ticket-detail-page__new-ticket-btn">
              <span>Prendre un nouveau ticket</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          } @else {
            <button type="button" class="ticket-detail-page__cancel-btn" (click)="showCancelModal.set(true)">
              <span class="ticket-detail-page__cancel-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </span>
              <span>Quitter la file</span>
            </button>
          }
        </div>
      }
    </app-client-layout>

    <!-- Confirmation Modal -->
    <app-confirm-modal
      [isOpen]="showCancelModal()"
      title="Quitter la file d'attente ?"
      message="Êtes-vous sûr de vouloir annuler ce ticket et quitter la file ?"
      confirmLabel="Quitter la file"
      cancelLabel="Retour"
      variant="danger"
      (confirm)="confirmLeaveQueue()"
      (cancel)="showCancelModal.set(false)"
    />
  `,
  styleUrl: './ticket-detail-page.scss'
})
export class TicketDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ticketService = inject(TicketService);
  private readonly auth = inject(AuthSessionService);

  protected ticket: Ticket | null = null;
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showCancelModal = signal(false);
  protected readonly queueBadgeInfoOpen = signal(false);

  private readonly syncTicketFromStore = effect(() => {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const updated = this.ticketService.tickets().find((t) => t.id === id);
    if (!updated) return;

    this.ticket = updated;
  });

  ngOnInit(): void {
    this.loadTicket();
    this.ticketService.loadTickets(true);
  }

  loadTicket(): void {
    this.loading.set(true);
    this.error.set(null);
    const id = this.route.snapshot.paramMap.get('id');

    this.ticketService.getTicketById(id).subscribe({
      next: (found) => {
        this.ticket = found;
        if (!found) {
          this.error.set('Ticket introuvable');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[TicketDetailPage] Error loading ticket:', err);
        this.error.set('Impossible de charger le ticket.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Rang dynamique dans la file :
   * Si 1ère personne au fauteuil : rang 1
   * Si en attente : rang = peopleAhead + 1 (ex. 4 -> 3 -> 2 -> 1)
   */
  protected get currentRank(): number {
    if (!this.ticket) return 1;
    if (this.ticket.status === 'your_turn') return 1;
    if (this.isServed || this.ticket.status === 'cancelled') {
      return this.ticket.ticketNumber || 1;
    }
    if (this.ticket.peopleAhead !== undefined && this.ticket.peopleAhead !== null) {
      return this.ticket.peopleAhead + 1;
    }
    return this.ticket.ticketNumber || 1;
  }

  protected get isHistory(): boolean {
    if (!this.ticket) return false;
    return (
      this.ticket.category === 'history' ||
      this.ticket.status === 'served' ||
      this.ticket.status === 'completed' ||
      this.ticket.status === 'cancelled'
    );
  }

  protected get isServed(): boolean {
    if (!this.ticket) return false;
    return this.ticket.status === 'served' || this.ticket.status === 'completed';
  }

  protected get formattedCreatedAt(): string {
    if (!this.ticket?.createdAt) return '';
    const date = new Date(this.ticket.createdAt);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-SN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected get formattedCancelledAt(): string {
    const ts = this.ticket?.cancelledAt || this.ticket?.servedAt;
    if (!ts) return '';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-SN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected get formattedServedAt(): string {
    if (!this.ticket?.servedAt) return '';
    const date = new Date(this.ticket.servedAt);
    return date.toLocaleDateString('fr-SN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected get statusTagText(): string {
    if (!this.ticket) return '';
    switch (this.ticket.status) {
      case 'served':
      case 'completed':
        return 'SERVI';
      case 'cancelled':
        return 'ANNULÉ';
      case 'your_turn':
        return 'MON TOUR';
      case 'waiting':
      default:
        return 'EN ATTENTE';
    }
  }

  /**
   * Couleur de l'anneau de progression, dynamique selon le nombre de
   * personnes devant le client (mis à jour en temps réel via le flux
   * temps réel) :
   * - En attente, 2+ personnes devant : bleu.
   * - En attente, plus qu'1 personne devant : bascule vers un ton proche
   *   du vert pour signaler que le tour approche.
   * - À son tour : vert plein (comme aujourd'hui).
   */
  protected get ringColor(): string {
    if (!this.ticket) return '#1E5AF0';
    switch (this.ticket.status) {
      case 'served':
      case 'completed':
        return '#16a34a';
      case 'cancelled':
        return '#dc2626';
      case 'your_turn':
        return '#16a34a';
      case 'waiting':
        return this.ticket.peopleAhead === 1 ? '#0d9488' : '#1E5AF0';
      default:
        return '#1E5AF0';
    }
  }

  /**
   * Nombre de personnes devant à partir duquel l'anneau est considéré "presque vide".
   * Le remplissage est une échelle absolue basée sur peopleAhead (pas sur le rang de
   * départ du ticket) : avec 1 seule personne devant, l'anneau doit déjà paraître
   * presque complet, peu importe la longueur de la file au moment de la prise du ticket.
   */
  private static readonly RING_REFERENCE_QUEUE = 8;
  private static readonly RING_MIN_FILL = 0.12;
  private static readonly RING_MAX_FILL = 0.97;

  /**
   * Le chargement circulaire augmente à mesure que le nombre de personnes
   * devant diminue (échelle absolue, mise à jour en temps réel) :
   * - 0 personne devant / à son tour : 100% (cercle complet).
   * - 1 personne devant : ~88% (presque complet).
   * - Personnes devant >= RING_REFERENCE_QUEUE : remplissage minimal visible.
   */
  protected get dashOffset(): number {
    if (!this.ticket || this.isHistory) {
      return 0;
    }
    if (this.ticket.status === 'your_turn') {
      return 0; // Plein à 100%
    }
    const peopleAhead = this.ticket.peopleAhead ?? Math.max(this.currentRank - 1, 0);
    if (peopleAhead <= 0) {
      return 0;
    }
    const fill = Math.min(
      TicketDetailPage.RING_MAX_FILL,
      Math.max(TicketDetailPage.RING_MIN_FILL, 1 - peopleAhead / TicketDetailPage.RING_REFERENCE_QUEUE)
    );
    return Math.round(502 * (1 - fill));
  }

  /**
   * NUMÉRO EN COURS :
   * Le numéro du ticket reste fixe; seul le ticket actuellement appelé avance.
   */
  protected get queueNumberDisplay(): string {
    if (!this.ticket) return '-';
    if (this.isServed) return 'Servi';
    if (this.ticket.status === 'cancelled') return 'Annulé';
    return `${this.currentQueueNumber}`;
  }

  /**
   * Vrai si le ticket actuellement appelé (NUMERO EN COURS) a été pris un jour
   * précédent (pas forcément "hier" : peut être plus ancien, la file suit
   * l'ordre d'arrivée et pas le numéro du jour).
   */
  protected get isCurrentTicketFromPreviousDay(): boolean {
    if (!this.ticket) return false;
    if (this.ticket.currentTicketIsYesterday !== undefined) {
      return !!this.ticket.currentTicketIsYesterday;
    }
    if (this.currentQueueNumber === this.ticket.ticketNumber && this.ticket.createdAt) {
      return this.isDateBeforeToday(this.ticket.createdAt);
    }
    return false;
  }

  private isDateBeforeToday(dateValue: string | Date): boolean {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  protected get currentQueueNumber(): number {
    if (!this.ticket) return 1;
    if (this.ticket.currentTicketNumber) {
      return this.ticket.currentTicketNumber;
    }

    // Le numéro du ticket est le compteur visible du jour : il ne reflète pas l'ordre
    // de passage (basé sur l'arrivée en file). Sans valeur fournie par le backend, on ne
    // peut pas deviner le ticket en cours : on affiche alors celui du client.
    return this.ticket.ticketNumber || 1;
  }

  protected get salonStatus(): 'open' | 'closed' {
    return this.isHistory ? 'closed' : 'open';
  }

  protected get isCoiffeur(): boolean {
    return this.auth.activeUser()?.role === 'coiffeur' || this.router.url.startsWith('/coiffeur');
  }

  protected get backRoute(): string {
    return this.isCoiffeur ? '/coiffeur/tickets' : '/client/tickets';
  }

  protected get displayOwnerName(): string {
    if (!this.ticket) return '';
    const ownerName = this.ticket.ownerName?.trim() || 'Client';
    if (this.isCoiffeur) {
      return ownerName;
    }
    const profileName = this.currentProfileName();
    const ownerType = (this.ticket.ownerType || '').toString().toUpperCase();

    if (profileName && (ownerType === 'SELF' || this.looksLikeSelfOwner(ownerName))) {
      return profileName;
    }

    return ownerName;
  }

  protected get targetSmsPhone(): string | null {
    const raw =
      this.ticket?.ownerPhone?.trim() ||
      (this.ticket?.user?.login && !this.ticket.user.login.includes('@') ? this.ticket.user.login.trim() : null) ||
      (!this.isCoiffeur ? (this.auth.currentUser()?.phone?.trim() || this.auth.activeUser()?.phone?.trim() || null) : null);

    if (!raw) return null;
    return this.auth.formatPhone(raw);
  }

  /**
   * Bascule l'explication du badge "Pris avant vous" — remplace le tooltip natif
   * (invisible sur mobile/tactile) par une bulle accessible au tap.
   */
  protected toggleQueueBadgeInfo(event: Event): void {
    event.stopPropagation();
    this.queueBadgeInfoOpen.update((open) => !open);
  }

  @HostListener('document:click')
  protected closeQueueBadgeInfo(): void {
    if (this.queueBadgeInfoOpen()) {
      this.queueBadgeInfoOpen.set(false);
    }
  }

  protected confirmLeaveQueue(): void {
    if (!this.ticket) return;
    this.showCancelModal.set(false);
    this.ticketService.cancelTicket(this.ticket.id).subscribe(() => {
      this.router.navigate([this.backRoute]);
    });
  }

  private currentProfileName(): string {
    const user = this.auth.currentUser();
    const name = user?.name?.trim();
    if (!user || user.id === 'guest' || !name || name === 'Mon Compte' || name === 'Utilisateur Fotolou') {
      return '';
    }
    return name;
  }

  private looksLikeSelfOwner(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === 'moi' ||
      normalized === 'moi-même' ||
      normalized === 'moi-meme' ||
      normalized.startsWith('moi ') ||
      normalized.startsWith('moi(')
    );
  }
}
