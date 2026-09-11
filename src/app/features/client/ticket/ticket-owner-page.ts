import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { TicketOwnerCard } from '../../../shared/components/ticket-owner-card/ticket-owner-card';
import { SalonService } from '../../../shared/services/salon.service';
import { TicketBeneficiaryPayload, TicketService } from '../../../shared/services/ticket.service';
import { RelativeService } from '../../../shared/services/relative.service';
import { TicketOwner } from '../../../shared/models/ticket-owner';
import { RELATION_LABELS } from '../../../shared/models/relative';
import { AuthSessionService } from '../../auth/auth-session.service';
import { HttpErrorMessageService } from '../../../shared/services/http-error-message.service';

@Component({
  selector: 'app-ticket-owner-page',
  imports: [
    ClientLayout,
    PageHeader,
    TicketOwnerCard
  ],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="true">
      <!-- Fixed Top Header -->
      <app-page-header
        slot="header"
        title="Prendre des tickets"
        [backRoute]="'/client/salons/' + salonId"
      />

      <!-- Scrollable Body Content -->
      <div class="ticket-owner-page__content">
        <!-- Hero Section -->
        <section class="ticket-owner-page__hero">
          <span class="ticket-owner-page__badge">File d'attente intelligente</span>
          <h1 class="ticket-owner-page__title">Pour qui prenez-vous le ticket ?</h1>
          <p class="ticket-owner-page__desc">
            Sélectionnez une ou plusieurs personnes. Fotolou réservera tous les tickets simultanément.
          </p>
        </section>

        <!-- Owners Multi-Selection List -->
        <section class="ticket-owner-page__list">
          @for (owner of allTicketOwners(); track owner.id) {
            <app-ticket-owner-card
              [owner]="owner"
              [isSelected]="isOwnerSelected(owner.id)"
              [customName]="customOwnerName()"
              [customPhone]="customOwnerPhone()"
              (cardClick)="toggleOwner(owner)"
              (cardLongPress)="onLongPress(owner)"
              (customNameChange)="onCustomNameChange($event)"
              (customPhoneChange)="onCustomPhoneChange($event)"
            />
          }
        </section>
      </div>

      <!-- Fixed Bottom Action Button -->
      <div slot="footer" class="ticket-owner-page__footer">
        @if (errorMessage()) {
          <div class="ticket-owner-page__error-banner" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }
        <button
          type="button"
          class="ticket-owner-page__submit-btn"
          [disabled]="selectedCount() === 0"
          (click)="openConfirmModal()"
        >
          <span>{{ submitButtonLabel() }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </app-client-layout>

    <!-- Confirmation & Success Modal -->
    @if (showModal()) {
      <div class="booking-modal__backdrop" role="presentation" (click)="onBackdropClick($event)">
        <div class="booking-modal__card" role="dialog" aria-modal="true">
          @if (modalState() === 'success') {
            <!-- SUCCESS STATE: Icône validée en vert qui disparaît après 2s -->
            <div class="booking-modal__success-state">
              <div class="booking-modal__success-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 class="booking-modal__success-title">Ticket validé !</h3>
              <p class="booking-modal__success-desc">
                Votre réservation a été confirmée avec succès.
              </p>
              <div class="booking-modal__success-progress">
                <div class="booking-modal__success-bar"></div>
              </div>
            </div>
          } @else {
            <!-- CONFIRM STATE -->
            <div class="booking-modal__header">
              <div class="booking-modal__icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                  <path d="M13 5v2"/>
                  <path d="M13 17v2"/>
                  <path d="M13 11v2"/>
                </svg>
              </div>
              <h3 class="booking-modal__title">Confirmer votre réservation</h3>
              <p class="booking-modal__desc">
                Voulez-vous valider {{ selectedCount() > 1 ? 'ces ' + selectedCount() + ' tickets' : 'ce ticket' }} dans la file d'attente ?
              </p>
            </div>

            <!-- Résumé -->
            <div class="booking-modal__summary">
              <div class="booking-modal__summary-row">
                <span class="booking-modal__summary-label">Salon</span>
                <span class="booking-modal__summary-val">{{ salonName() }}</span>
              </div>
              <div class="booking-modal__summary-row">
                <span class="booking-modal__summary-label">Bénéficiaire(s)</span>
                <span class="booking-modal__summary-val">{{ beneficiaryNamesList() }}</span>
              </div>
            </div>

            @if (modalError()) {
              <div class="booking-modal__error-banner" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{{ modalError() }}</span>
              </div>
            }

            <div class="booking-modal__actions">
              <button
                type="button"
                class="booking-modal__cancel-btn"
                [disabled]="modalState() === 'loading'"
                (click)="closeModal()"
              >
                Annuler
              </button>
              <button
                type="button"
                class="booking-modal__confirm-btn"
                [disabled]="modalState() === 'loading'"
                (click)="confirmBooking()"
              >
                @if (modalState() === 'loading') {
                  <span>Validation</span><span class="loading-dots" aria-hidden="true"></span>
                } @else {
                  <span>Valider mon ticket</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                }
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './ticket-owner-page.scss'
})
export class TicketOwnerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly salonService = inject(SalonService);
  private readonly ticketService = inject(TicketService);
  private readonly relativeService = inject(RelativeService);
  private readonly auth = inject(AuthSessionService);
  private readonly errorMessages = inject(HttpErrorMessageService);

  protected salonId = 'king-barber';
  protected readonly salonName = signal<string>('Salon');

  // Multi-selection state
  protected readonly selectedOwnerIds = signal<string[]>(['self']);
  protected readonly customOwnerName = signal<string>('');
  protected readonly customOwnerPhone = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);

  // Modal State
  protected readonly showModal = signal<boolean>(false);
  protected readonly modalState = signal<'confirm' | 'loading' | 'success'>('confirm');
  protected readonly modalError = signal<string | null>(null);

  protected readonly selectedCount = computed(() => this.selectedOwnerIds().length);

  // Dynamic list combining Self, Dynamic Relatives, and Custom
  protected readonly allTicketOwners = computed<TicketOwner[]>(() => {
    const user = this.auth.activeUser();
    const selfName = user && user.name && user.name !== 'Mon Compte' && user.id !== 'guest'
      ? `Moi (${user.name})`
      : 'Moi-même';
    const selfPhone = user?.phone || 'Mon numéro de téléphone';
    const selfInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'M';

    const defaultSelf: TicketOwner = {
      id: 'self',
      type: 'self',
      name: selfName,
      subtitle: selfPhone,
      phone: user?.phone || undefined,
      avatarInitials: selfInitial
    };

    const relatives = this.relativeService.relatives().map(r => ({
      id: r.id,
      type: 'relative' as const,
      name: r.name,
      subtitle: r.phone ? `${RELATION_LABELS[r.relation]} - ${r.phone}` : RELATION_LABELS[r.relation],
      phone: r.phone
    }));

    const customPerson: TicketOwner = {
      id: 'custom',
      type: 'custom',
      name: 'Autre personne',
      subtitle: 'Saisir un nom personnalisé',
      isCustomInput: true
    };

    return [defaultSelf, ...relatives, customPerson];
  });

  protected readonly beneficiaryNamesList = computed(() => {
    return this.buildSelectedBeneficiaries().map((beneficiary) => beneficiary.name).join(', ');
  });

  protected readonly submitButtonLabel = computed(() => {
    const count = this.selectedCount();
    if (count <= 1) {
      return 'Confirmer mon ticket (1 ticket)';
    }
    return `Confirmer les ${count} tickets en même temps`;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.salonId = id;
      this.salonService.getSalonById(id).subscribe((s) => {
        if (s) {
          this.salonName.set(s.name);
          if (s.status?.toLowerCase() === 'closed') {
            alert('Ce salon est actuellement fermé. Les prises de ticket sont temporairement suspendues.');
            this.router.navigate(['/client/salons', id]);
          }
        }
      });
    }
  }

  protected isFirstRelative(owner: TicketOwner): boolean {
    const list = this.allTicketOwners();
    const firstRel = list.find(o => o.type === 'relative');
    return firstRel?.id === owner.id;
  }

  protected isOwnerSelected(ownerId: string): boolean {
    return this.selectedOwnerIds().includes(ownerId);
  }

  protected toggleOwner(owner: TicketOwner): void {
    const current = this.selectedOwnerIds();
    if (current.includes(owner.id)) {
      if (current.length > 1) {
        this.selectedOwnerIds.set(current.filter(id => id !== owner.id));
      }
    } else {
      this.selectedOwnerIds.set([...current, owner.id]);
    }
  }

  protected onLongPress(owner: TicketOwner): void {
    this.toggleOwner(owner);
  }

  protected onCustomNameChange(name: string): void {
    this.customOwnerName.set(name);
  }

  protected onCustomPhoneChange(phone: string): void {
    this.customOwnerPhone.set(phone);
  }

  protected openConfirmModal(): void {
    const selectedIds = this.selectedOwnerIds();
    if (selectedIds.length === 0) return;

    this.errorMessage.set(null);
    this.modalError.set(null);

    const beneficiaries = this.buildSelectedBeneficiaries();

    // Validation 1: Empêcher les doublons de nom dans la même sélection
    const lowerNames = beneficiaries.map((beneficiary) => beneficiary.name.toLowerCase().trim());
    const hasDuplicate = lowerNames.some((name, idx) => lowerNames.indexOf(name) !== idx);
    if (hasDuplicate) {
      this.errorMessage.set('Impossible de sélectionner plusieurs fois la même personne dans la même file.');
      return;
    }

    const validationError = this.validateBeneficiaries(beneficiaries);
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.modalState.set('confirm');
    this.showModal.set(true);
  }

  private buildSelectedBeneficiaries(): TicketBeneficiaryPayload[] {
    const allOwners = this.allTicketOwners();

    return this.selectedOwnerIds().map((id) => {
      if (id === 'self') {
        const selfPhone = this.auth.currentUser()?.phone?.trim() || this.auth.activeUser()?.phone?.trim() || undefined;
        return {
          name: 'Moi',
          type: 'SELF',
          phone: selfPhone
        };
      }

      if (id === 'custom') {
        const customName = this.customOwnerName().trim();
        const customPhone = this.customOwnerPhone().trim();
        return {
          name: customName || (customPhone ? `Client (${customPhone})` : 'Autre personne'),
          type: 'CUSTOM',
          phone: customPhone || undefined
        };
      }

      const owner = allOwners.find((item) => item.id === id);
      const relativeId = Number(id);
      return {
        name: owner?.name || 'Client',
        type: 'RELATIVE',
        relativeId: Number.isFinite(relativeId) ? relativeId : undefined,
        phone: owner?.phone
      };
    });
  }

  private validateBeneficiaries(beneficiaries: TicketBeneficiaryPayload[]): string | null {
    const lowerNames = beneficiaries.map((beneficiary) => beneficiary.name.toLowerCase().trim());
    const hasDuplicateName = lowerNames.some((name, idx) => lowerNames.indexOf(name) !== idx);
    if (hasDuplicateName) {
      return 'Impossible de selectionner plusieurs fois la meme personne dans la meme file.';
    }

    const currentUserPhone = this.normalizePhoneForCompare(this.auth.activeUser().phone);
    const requestedPhones = new Set<string>();

    for (const beneficiary of beneficiaries) {
      const rawPhone = beneficiary.phone?.trim() || '';
      const normalizedPhone = this.normalizePhoneForCompare(rawPhone);

      if (rawPhone && !normalizedPhone) {
        return 'Numero de telephone invalide. Utilisez un numero senegalais a 9 chiffres ou un format international.';
      }

      if (!normalizedPhone || beneficiary.type === 'SELF') {
        continue;
      }

      if (currentUserPhone && normalizedPhone === currentUserPhone) {
        return 'Vous ne pouvez pas utiliser votre propre numero pour une autre personne.';
      }

      if (requestedPhones.has(normalizedPhone)) {
        return 'Le meme numero de telephone ne peut pas etre utilise pour plusieurs beneficiaires.';
      }

      requestedPhones.add(normalizedPhone);
    }

    return null;
  }

  private normalizePhoneForCompare(rawPhone: string | undefined): string {
    if (!rawPhone) {
      return '';
    }

    let normalized = rawPhone.replace(/[^0-9+]/g, '');
    if (!normalized) {
      return '';
    }

    if (normalized.startsWith('00')) {
      normalized = `+${normalized.slice(2)}`;
    }

    if (!normalized.startsWith('+')) {
      if (normalized.startsWith('221')) {
        normalized = `+${normalized}`;
      } else if (normalized.length === 9) {
        normalized = `+221${normalized}`;
      }
    }

    const digitsCount = normalized.replace(/\D/g, '').length;
    return digitsCount >= 9 ? normalized : '';
  }

  protected closeModal(): void {
    if (this.modalState() === 'loading') return;
    this.showModal.set(false);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && this.modalState() !== 'loading' && this.modalState() !== 'success') {
      this.closeModal();
    }
  }

  protected confirmBooking(): void {
    const selectedIds = this.selectedOwnerIds();
    if (selectedIds.length === 0 || this.modalState() === 'loading') return;

    this.modalState.set('loading');
    this.modalError.set(null);

    const beneficiaries = this.buildSelectedBeneficiaries();
    const validationError = this.validateBeneficiaries(beneficiaries);
    if (validationError) {
      this.modalState.set('confirm');
      this.modalError.set(validationError);
      return;
    }

    this.salonService.getSalonById(this.salonId).subscribe({
      next: (salon) => {
        const salonName = salon?.name || this.salonName() || 'King Barber';
        const effectiveSalonId = (salon?.numericId ? salon.numericId.toString() : this.salonId);
        const salonSlug = salon?.slug || this.salonId;

        this.ticketService.createMultipleTickets(effectiveSalonId, salonName, beneficiaries, salonSlug).subscribe({
          next: () => {
            // SUCCESS STATE: Affiche l'icône validée en vert dans le même modal
            this.modalState.set('success');
            // Disparaît après 2 secondes et redirige
            setTimeout(() => {
              this.showModal.set(false);
              this.router.navigate(['/client/tickets']);
            }, 2000);
          },
          error: (err) => {
            this.modalState.set('confirm');
            this.modalError.set(this.errorMessages.message(err, 'Une erreur est survenue lors de la reservation du ticket.'));
          }
        });
      },
      error: (err) => {
        this.modalState.set('confirm');
        this.modalError.set(this.errorMessages.message(err, 'Impossible de joindre le salon. Verifiez votre connexion.'));
      }
    });
  }
}
