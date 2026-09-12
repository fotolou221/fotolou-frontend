import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { NotificationService } from '../../../shared/services/notification.service';
import { TicketService } from '../../../shared/services/ticket.service';
import { SalonService } from '../../../shared/services/salon.service';
import { AuthSessionService } from '../../auth/auth-session.service';
import { FormsModule } from '@angular/forms';
import { Ticket, compareTicketQueueOrder } from '../../../shared/models/ticket';
import { HttpErrorMessageService } from '../../../shared/services/http-error-message.service';

@Component({
  selector: 'app-coiffeur-tickets-page',
  imports: [
    ClientLayout,
    LocationHeader,
    EmptyStateComponent,
    FormsModule
  ],
  template: `
    <app-client-layout activeNav="tickets" role="coiffeur" [hasHeaderSlot]="true">
      <!-- Fixed Header Slot -->
      <app-location-header
        slot="header"
        [showLocation]="false"
        [hasNotification]="notificationService.coiffeurUnreadCount() > 0"
        (notificationClick)="goToNotifications()"
      />

      <!-- Content -->
      <div class="coiffeur-tickets">
        <!-- Toast Feedback Message -->
        @if (toastMessage()) {
          <div class="coiffeur-toast">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="coiffeur-toast__icon">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{{ toastMessage() }}</span>
          </div>
        }

        <!-- Tab Selector -->
        <div class="coiffeur-tickets__tabs" role="tablist">
          <button
            type="button"
            class="coiffeur-tickets__tab"
            [class.coiffeur-tickets__tab--active]="activeTab() === 'active'"
            (click)="activeTab.set('active')"
            role="tab"
          >
            File en direct ({{ activeCount() }})
          </button>
          <button
            type="button"
            class="coiffeur-tickets__tab"
            [class.coiffeur-tickets__tab--active]="activeTab() === 'history'"
            (click)="activeTab.set('history')"
            role="tab"
          >
            Historique ({{ historyCount() }})
          </button>
        </div>

        <!-- Section Title & Actions -->
        <div class="coiffeur-tickets__section-header">
          <h1 class="coiffeur-tickets__title">
            {{ activeTab() === 'active' ? 'Clients dans la file' : 'Historique des passages' }}
          </h1>

          @if (activeTab() === 'active') {
            <button type="button" class="coiffeur-tickets__add-btn" (click)="openAddModal()">
              + Ajouter un client
            </button>
          }
        </div>

        <!-- Live Queue List -->
        <div class="coiffeur-tickets__list">
          @for (item of displayedTickets(); track item.id; let idx = $index) {
            <div
              class="queue-card"
              [class.queue-card--current]="isCurrentClient(item, idx)"
              [class.queue-card--waiting]="!isCurrentClient(item, idx) && activeTab() === 'active'"
            >
              <div class="queue-card__top">
                <!-- Position Box -->
                <div
                  class="queue-card__pos-box"
                  [class.queue-card__pos-box--current]="isCurrentClient(item, idx)"
                >
                  #{{ item.ticketNumber }}
                </div>

                <!-- Client Info -->
                <div class="queue-card__info">
                  <strong class="queue-card__name">{{ item.ownerName }}</strong>
                  <span class="queue-card__phone">{{ item.salonName }} &bull; Dakar</span>
                </div>

                <!-- Status Tag : Un seul En cours, les autres En attente -->
                <span
                  class="queue-card__status-tag"
                  [class.queue-card__status-tag--current]="isCurrentClient(item, idx)"
                  [class.queue-card__status-tag--waiting]="!isCurrentClient(item, idx) && activeTab() === 'active'"
                  [class.queue-card__status-tag--served]="item.status === 'served' || item.status === 'completed'"
                  [class.queue-card__status-tag--cancelled]="item.status === 'cancelled'"
                >
                  {{ getStatusText(item, isCurrentClient(item, idx)) }}
                </span>
              </div>

              <!-- Action Bar with Icons Only (Active tab) -->
              @if (activeTab() === 'active') {
                <div class="queue-card__bottom">
                  <div class="queue-card__pos-indicator">
                    @if (isCurrentClient(item, idx)) {
                      <span class="queue-card__sub-badge queue-card__sub-badge--chair">
                        <span class="pulse-indicator"></span> Au fauteuil
                      </span>
                    } @else {
                      <span class="queue-card__sub-badge queue-card__sub-badge--waiting">
                        {{ getQueuePositionText(idx) }}
                      </span>
                    }
                  </div>

                  <!-- Icons Action Group -->
                  <div class="queue-card__icons-group">
                    <!-- 1. Icon Appeler -->
                    <button
                      type="button"
                      class="queue-card__icon-btn queue-card__icon-btn--call"
                      [disabled]="!getClientPhone(item)"
                      (click)="callClient(item)"
                      [title]="getClientPhone(item) ? ('Appeler ' + item.ownerName + ' (' + getClientPhone(item) + ')') : 'Numéro de téléphone non renseigné'"
                      [aria-label]="getClientPhone(item) ? ('Appeler ' + item.ownerName) : 'Numéro non renseigné'"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </button>

                    <!-- 2. Icon Sauter / Annuler -->
                    <button
                      type="button"
                      class="queue-card__icon-btn queue-card__icon-btn--skip"
                      [disabled]="!isCurrentClient(item, idx)"
                      (click)="openConfirmModal(item, 'skip')"
                      title="Sauter / Annuler"
                      aria-label="Sauter ce tour"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    </button>

                    <!-- 3. Icon Marquer Servi -->
                    <button
                      type="button"
                      class="queue-card__icon-btn queue-card__icon-btn--served"
                      [disabled]="!isCurrentClient(item, idx)"
                      (click)="openConfirmModal(item, 'served')"
                      title="Marquer comme servi"
                      aria-label="Marquer comme servi"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          } @empty {
            <app-empty-state
              icon="ticket"
              [title]="activeTab() === 'active' ? 'File d\\'attente vide' : 'Aucun historique'"
              [description]="activeTab() === 'active' ? 'Aucun client n\\'est en attente pour le moment.' : 'L\\'historique des tickets servis apparaîtra ici.'"
            />
          }
        </div>
      </div>
    </app-client-layout>

    <!-- Confirmation Modal Before Skipping or Serving -->
    @if (confirmModalTarget()) {
      <div class="confirm-modal-backdrop" (click)="closeConfirmModal()">
        <div class="confirm-modal" (click)="$event.stopPropagation()">
          <div
            class="confirm-modal__icon"
            [class.confirm-modal__icon--danger]="confirmModalAction() === 'skip'"
            [class.confirm-modal__icon--success]="confirmModalAction() === 'served'"
          >
            @if (confirmModalAction() === 'skip') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            }
          </div>

          <h3 class="confirm-modal__title">
            @if (confirmModalAction() === 'skip') {
              Sauter le tour de ce client ?
            } @else {
              Valider la prestation ?
            }
          </h3>

          <p class="confirm-modal__desc">
            @if (confirmModalAction() === 'skip') {
              Le client <strong>{{ confirmModalTarget()?.ownerName }}</strong> (Ticket #{{ confirmModalTarget()?.ticketNumber }}) n'est pas présent ? Cette action libérera le fauteuil et appellera le client suivant.
            } @else {
              Confirmez-vous que la coupe de <strong>{{ confirmModalTarget()?.ownerName }}</strong> (Ticket #{{ confirmModalTarget()?.ticketNumber }}) est terminée ?
            }
          </p>

          <div class="confirm-modal__actions">
            <button
              type="button"
              class="confirm-modal__btn confirm-modal__btn--cancel"
              (click)="closeConfirmModal()"
              [disabled]="isProcessingAction()"
            >
              Annuler
            </button>

            <button
              type="button"
              class="confirm-modal__btn"
              [class.confirm-modal__btn--danger]="confirmModalAction() === 'skip'"
              [class.confirm-modal__btn--success]="confirmModalAction() === 'served'"
              (click)="executeConfirmedAction()"
              [disabled]="isProcessingAction()"
            >
              @if (isProcessingAction()) {
                <span>Traitement</span><span class="loading-dots" aria-hidden="true"></span>
              } @else if (confirmModalAction() === 'skip') {
                Oui, sauter
              } @else {
                Oui, valider
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Quick Add Walk-in Modal (No Salon field, Name + Phone) -->
    @if (showAddModal()) {
      <div class="walkin-modal-backdrop" (click)="showAddModal.set(false)">
        <div class="walkin-modal" (click)="$event.stopPropagation()">
          <div class="walkin-modal__header">
            <h2 class="walkin-modal__title">Ajouter un client direct</h2>
            <button type="button" class="walkin-modal__close-btn" (click)="showAddModal.set(false)" aria-label="Fermer">✕</button>
          </div>

          <p class="walkin-modal__info-text">
            Saisissez le nom, le numéro de téléphone ou les deux. Au moins un champ est requis.
          </p>

          <div class="walkin-modal__field">
            <label>Nom du client <span class="walkin-modal__hint">(Optionnel si numéro renseigné)</span></label>
            <input
              type="text"
              [(ngModel)]="walkInName"
              placeholder="Ex: Ousmane Sow"
              autofocus
              (keydown.enter)="submitWalkIn()"
            />
          </div>

          <div class="walkin-modal__field">
            <label>Numéro de téléphone <span class="walkin-modal__hint">(Optionnel si nom renseigné)</span></label>
            <input
              type="tel"
              [(ngModel)]="walkInPhone"
              placeholder="Ex: +221 77 123 45 67"
              (keydown.enter)="submitWalkIn()"
            />
            <span class="walkin-modal__sms-tag">
              📲 Si renseigné, le ticket lui sera envoyé par SMS
            </span>
          </div>

          <div class="walkin-modal__actions">
            <button
              type="button"
              class="walkin-modal__cancel-btn"
              (click)="showAddModal.set(false)"
              [disabled]="isAddingClient()"
            >
              Annuler
            </button>
            <button
              type="button"
              class="walkin-modal__submit-btn"
              (click)="submitWalkIn()"
              [disabled]="isAddingClient() || (!walkInName.trim() && !walkInPhone.trim())"
            >
              @if (isAddingClient()) {
                <span>Ajout en cours</span><span class="loading-dots" aria-hidden="true"></span>
              } @else {
                Ajouter à la file
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- 3-Second Ticket Announcement Popup -->
    @if (createdTicketPopup(); as popup) {
      <div class="ticket-popup-backdrop" (click)="closeAnnouncementPopup()">
        <div class="ticket-popup-card" (click)="$event.stopPropagation()">
          <div class="ticket-popup-card__badge-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <span class="ticket-popup-card__subtitle">Client ajouté avec succès !</span>
          <h3 class="ticket-popup-card__heading">Numéro de passage</h3>

          <div class="ticket-popup-card__ticket-pill">
            <span class="ticket-popup-card__ticket-number">#{{ popup.ticketNumber }}</span>
          </div>

          <p class="ticket-popup-card__client-name">{{ popup.clientName }}</p>

          @if (popup.clientPhone) {
            <p class="ticket-popup-card__sms-info">
              ✓ Notification SMS transmise au {{ popup.clientPhone }}
            </p>
          }

          <div class="ticket-popup-card__footer">
            <span class="ticket-popup-card__countdown">Fermeture automatique dans <strong>{{ countdownSeconds() }}s</strong></span>
            <button type="button" class="ticket-popup-card__close-btn" (click)="closeAnnouncementPopup()">
              OK
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './coiffeur-tickets-page.scss'
})
export class CoiffeurTicketsPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly ticketService = inject(TicketService);
  protected readonly salonService = inject(SalonService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly auth = inject(AuthSessionService);
  private readonly errorMessages = inject(HttpErrorMessageService);

  protected readonly activeTab = signal<'active' | 'history'>('active');
  protected readonly showAddModal = signal(false);
  protected readonly isAddingClient = signal(false);
  protected walkInName = '';
  protected walkInPhone = '';

  // ── Created Ticket Announcement Popup (3s auto-close) ────────
  protected readonly createdTicketPopup = signal<{
    ticketNumber: number;
    clientName: string;
    clientPhone?: string;
  } | null>(null);
  protected readonly countdownSeconds = signal(3);
  private countdownInterval?: any;

  protected readonly toastMessage = signal<string | null>(null);

  // ── Action Confirmation Modal State ─────────────────────────
  protected readonly confirmModalTarget = signal<Ticket | null>(null);
  protected readonly confirmModalAction = signal<'served' | 'skip'>('served');
  protected readonly isProcessingAction = signal(false);

  protected readonly allTickets = computed(() => this.ticketService.tickets());

  protected readonly activeCount = computed(() =>
    this.allTickets().filter((t) => t.category === 'active').length
  );

  protected readonly historyCount = computed(() =>
    this.allTickets().filter((t) => t.category === 'history').length
  );

  /**
   * Liste triée pour affichage :
   * - File active : ordre réel d'arrivée en file (createdAt puis id), pas le numéro affiché
   *   (un #1 pris le lendemain ne doit pas passer devant un #999 de la veille encore actif)
   * - Historique : trié par date de création décroissante
   */
  protected readonly displayedTickets = computed(() => {
    const tab = this.activeTab();
    const list = this.allTickets().filter((t) => t.category === tab);
    if (tab === 'active') {
      return [...list].sort(compareTicketQueueOrder);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  ngOnInit(): void {
    // Recharger systématiquement les tickets du salon connecté
    this.ticketService.loadTickets();
  }

  /**
   * Seul et unique client actuellement au fauteuil :
   * - En onglet actif uniquement
   * - Premier ticket de la file active (ou celui avec 'your_turn')
   */
  protected isCurrentClient(item: Ticket, index: number): boolean {
    if (this.activeTab() !== 'active') return false;
    const activeList = this.displayedTickets();
    if (activeList.length === 0) return false;
    const currentItem = activeList.find((t) => t.status === 'your_turn') || activeList[0];
    return currentItem ? currentItem.id === item.id : false;
  }

  /**
   * Texte du badge d'état : UN SEUL "En cours", les autres "En attente"
   */
  protected getStatusText(item: Ticket, isCurrent: boolean): string {
    if (this.activeTab() === 'history' || item.category === 'history') {
      if (item.status === 'served' || item.status === 'completed') return 'SERVI';
      if (item.status === 'cancelled') return 'ANNULÉ';
    }
    if (isCurrent || item.status === 'your_turn') {
      return 'En cours';
    }
    return 'En attente';
  }

  protected getQueuePositionText(index: number): string {
    if (index === 0) return 'Au fauteuil';
    return `${index + 1}e dans la file`;
  }

  protected getSalonDisplayName(): string {
    const user = this.auth.activeUser();
    if (user?.name && user.name !== 'Espace Barbier') {
      return user.name;
    }
    const salons = this.salonService.salons();
    return salons[0]?.name || 'Mon Salon';
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

  protected callClient(item: Ticket): void {
    const phone = this.getClientPhone(item);
    if (!phone) {
      this.showToast(`Numéro de téléphone non renseigné pour ${item.ownerName}.`);
      return;
    }

    // Déclencher immédiatement l'ouverture du composeur téléphonique natif
    const cleanTel = phone.replace(/\s+/g, '');
    window.location.href = `tel:${cleanTel}`;

    // Émettre également l'événement d'appel système et afficher le toast de confirmation
    this.ticketService.callTicket(item.id).subscribe({
      next: () => {
        this.showToast(`Appel vers ${item.ownerName} (${phone})...`);
      },
      error: () => {
        // Silencieux : l'appel direct a déjà été envoyé au composeur natif
      }
    });
  }

  protected openConfirmModal(item: Ticket, action: 'served' | 'skip'): void {
    this.confirmModalTarget.set(item);
    this.confirmModalAction.set(action);
  }

  protected closeConfirmModal(): void {
    if (this.isProcessingAction()) return;
    this.confirmModalTarget.set(null);
  }

  protected executeConfirmedAction(): void {
    const target = this.confirmModalTarget();
    const action = this.confirmModalAction();
    if (!target || this.isProcessingAction()) return;

    this.isProcessingAction.set(true);

    const request$ = action === 'served'
      ? this.ticketService.serveTicket(target.id)
      : this.ticketService.cancelTicket(target.id);

    request$.subscribe({
      next: () => {
        this.isProcessingAction.set(false);
        this.confirmModalTarget.set(null);
        const msg = action === 'served'
          ? `Prestation de ${target.ownerName} validée avec succès.`
          : `Tour de ${target.ownerName} sauté / annulé.`;
        this.showToast(msg);
      },
      error: (err) => {
        this.isProcessingAction.set(false);
        this.confirmModalTarget.set(null);
        this.showToast(this.errorMessages.message(err, 'Action impossible pour le moment. Verifiez votre connexion.'));
      }
    });
  }

  protected openAddModal(): void {
    this.walkInName = '';
    this.walkInPhone = '';
    this.showAddModal.set(true);
  }

  protected submitWalkIn(): void {
    const name = this.walkInName.trim();
    const phone = this.walkInPhone.trim();
    if (!name && !phone) return;
    if (this.isAddingClient()) return;

    this.isAddingClient.set(true);

    const user = this.auth.activeUser();
    let salonId = user?.salonId;
    if (!salonId) {
      const salon = this.salonService.salons()[0];
      salonId = salon?.id || salon?.numericId || 1;
    }
    const numericSalonId = Number(salonId) || 1;
    const finalName = name || `Client (${phone})`;

    this.ticketService.addWalkInTicket(numericSalonId, finalName, phone || undefined).subscribe({
      next: (created) => {
        this.isAddingClient.set(false);
        this.showAddModal.set(false);
        this.walkInName = '';
        this.walkInPhone = '';

        // Trigger 3s popup!
        this.triggerTicketAnnouncement(created.ticketNumber, created.ownerName, phone || undefined);
      },
      error: (err) => {
        console.error('[CoiffeurTickets] Erreur addWalkInTicket:', err);
        this.isAddingClient.set(false);
        this.showToast(this.errorMessages.message(err, "Erreur lors de l'enregistrement du client. Verifiez votre connexion."));
      }
    });
  }

  protected triggerTicketAnnouncement(ticketNumber: number, clientName: string, clientPhone?: string): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.createdTicketPopup.set({ ticketNumber, clientName, clientPhone });
    this.countdownSeconds.set(3);

    this.countdownInterval = setInterval(() => {
      const remaining = this.countdownSeconds();
      if (remaining <= 1) {
        this.closeAnnouncementPopup();
      } else {
        this.countdownSeconds.set(remaining - 1);
      }
    }, 1000);
  }

  protected closeAnnouncementPopup(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
    this.createdTicketPopup.set(null);
  }

  protected showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  protected goToNotifications(): void {
    this.router.navigate(['/coiffeur/notifications']);
  }
}
