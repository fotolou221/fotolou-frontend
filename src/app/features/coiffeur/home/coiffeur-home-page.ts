import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { TicketService } from '../../../shared/services/ticket.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { SalonService } from '../../../shared/services/salon.service';
import { AuthSessionService } from '../../auth/auth-session.service';

interface RecentActivity {
  readonly id: string;
  readonly initial: string;
  readonly name: string;
  readonly date: string;
  readonly status: 'SERVI' | 'ANNULÉ';
  readonly avatarBg: string;
}

@Component({
  selector: 'app-coiffeur-home-page',
  imports: [
    ClientLayout,
    LocationHeader
  ],
  template: `
    <app-client-layout activeNav="home" role="coiffeur" [hasHeaderSlot]="true">
      <!-- Fixed Header Slot -->
      <app-location-header
        slot="header"
        [showLocation]="false"
        [hasNotification]="notificationService.coiffeurUnreadCount() > 0"
        (notificationClick)="goToNotifications()"
      />

      <!-- Content Body -->
      <div class="coiffeur-home">
        <!-- Hero Card -->
        <section class="coiffeur-hero">
          <div class="coiffeur-hero__overlay"></div>

          <div class="coiffeur-hero__content">
            <span class="coiffeur-hero__label">CLIENTS EN ATTENTE</span>
            <div class="coiffeur-hero__main-row">
              <span class="coiffeur-hero__count">{{ ticketService.activeCount() }}</span>

              <div class="coiffeur-hero__right">
                <span class="coiffeur-hero__trend">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                  {{ isQueueOpen() ? 'File Ouverte' : 'File Fermée' }}
                </span>

                <!-- Toggle Switch -->
                <button
                  type="button"
                  class="coiffeur-toggle"
                  [class.coiffeur-toggle--active]="isQueueOpen()"
                  (click)="toggleQueue()"
                  [attr.aria-label]="isQueueOpen() ? 'Fermer la file' : 'Ouvrir la file'"
                >
                  <span class="coiffeur-toggle__thumb"></span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Stats Row Cards -->
        <section class="coiffeur-stats">
          <div class="coiffeur-stat-card">
            <span class="coiffeur-stat-card__label">EN ATTENTE</span>
            <span class="coiffeur-stat-card__val">{{ ticketService.activeCount() }}</span>
            <div class="coiffeur-stat-card__bar-track">
              <div class="coiffeur-stat-card__bar-fill coiffeur-stat-card__bar-fill--current" [style.width.%]="ticketService.activeCount() * 20"></div>
            </div>
          </div>

          <div class="coiffeur-stat-card">
            <span class="coiffeur-stat-card__label">SERVIS</span>
            <span class="coiffeur-stat-card__val">{{ ticketService.historyCount() }}</span>
            <div class="coiffeur-stat-card__bar-track">
              <div class="coiffeur-stat-card__bar-fill coiffeur-stat-card__bar-fill--served" [style.width.%]="ticketService.historyCount() * 10"></div>
            </div>
          </div>

          <div class="coiffeur-stat-card">
            <span class="coiffeur-stat-card__label">ANNULÉS</span>
            <span class="coiffeur-stat-card__val">{{ ticketService.cancelledCount() }}</span>
            <div class="coiffeur-stat-card__bar-track">
              <div class="coiffeur-stat-card__bar-fill coiffeur-stat-card__bar-fill--cancelled" [style.width.%]="ticketService.cancelledCount() * 10"></div>
            </div>
          </div>
        </section>

        <!-- Action Grid Menu -->
        <section class="coiffeur-actions">
          <button type="button" class="coiffeur-action-btn" (click)="router.navigate(['/coiffeur/tickets'])">
            <div class="coiffeur-action-btn__icon coiffeur-action-btn__icon--queue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="coiffeur-action-btn__text">
              <strong>Gérer la File</strong>
              <span>Appeler le prochain client</span>
            </div>
          </button>

          <button type="button" class="coiffeur-action-btn" (click)="router.navigate(['/coiffeur/profile'])">
            <div class="coiffeur-action-btn__icon coiffeur-action-btn__icon--salon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div class="coiffeur-action-btn__text">
              <strong>Mon Salon</strong>
              <span>Horaires &amp; profil</span>
            </div>
          </button>
        </section>

        <!-- Recent Activity Feed -->
        <section class="coiffeur-activity">
          <div class="coiffeur-activity__header">
            <h3>Activité Récente</h3>
            <span class="coiffeur-activity__badge">Aujourd'hui</span>
          </div>

          <div class="coiffeur-activity__list">
            @for (item of recentActivities(); track item.id) {
              <div class="activity-card">
                <div class="activity-card__avatar" [style.background-color]="item.avatarBg">
                  <span>{{ item.initial }}</span>
                </div>

                <div class="activity-card__info">
                  <strong>{{ item.name }}</strong>
                  <span class="activity-card__date">{{ item.date }}</span>
                </div>

                <span
                  class="activity-card__badge"
                  [class.activity-card__badge--served]="item.status === 'SERVI'"
                  [class.activity-card__badge--cancelled]="item.status === 'ANNULÉ'"
                >
                  {{ item.status }}
                </span>
              </div>
            } @empty {
              <div class="coiffeur-activity__empty">
                <p>Aucune activité récente</p>
                <span>Les clients servis ou annulés s'afficheront ici en direct.</span>
              </div>
            }
          </div>
        </section>
      </div>
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

  private readonly manualQueueState = signal<boolean | null>(null);

  protected readonly currentSalon = computed(() => {
    const user = this.authSession.currentUser();
    const salonId = user?.salonId?.toString() || user?.salonSlug;
    if (salonId) {
      return this.salonService.salons().find((s) => s.id === salonId || s.slug === salonId) || null;
    }
    return this.salonService.salons()[0] || null;
  });

  protected readonly isQueueOpen = computed(() => {
    if (this.manualQueueState() !== null) {
      return this.manualQueueState()!;
    }
    const s = this.currentSalon();
    return s ? s.status === 'open' : true;
  });

  private readonly avatarColors = ['#eef2ff', '#fee2e2', '#fef3c7', '#f1f5f9', '#e0e7ff'];

  protected readonly recentActivities = computed<RecentActivity[]>(() => {
    const historyTickets = this.ticketService.tickets().filter((t) => t.category === 'history');
    if (historyTickets.length > 0) {
      return historyTickets.slice(0, 5).map((t, idx) => ({
        id: t.id,
        initial: (t.ownerName || 'C').charAt(0).toUpperCase(),
        name: t.ownerName || 'Client',
        date: t.servedAt ? new Date(t.servedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Récemment',
        status: (t.status === 'served' || t.status === 'completed' ? 'SERVI' : 'ANNULÉ') as 'SERVI' | 'ANNULÉ',
        avatarBg: this.avatarColors[idx % this.avatarColors.length]
      }));
    }

    return [];
  });

  protected toggleQueue(): void {
    const next = !this.isQueueOpen();
    this.manualQueueState.set(next);

    const s = this.currentSalon();
    if (s && s.id) {
      this.salonService.toggleSalonStatus(s.id).subscribe();
    }
  }

  protected goToNotifications(): void {
    this.router.navigate(['/coiffeur/notifications']);
  }
}
