import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { ConfirmModal } from '../../../shared/components/confirm-modal/confirm-modal';
import { TicketService } from '../../../shared/services/ticket.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthSessionService } from '../../auth/auth-session.service';

@Component({
  selector: 'app-client-profile-page',
  imports: [ClientLayout, LocationHeader, StatCard, ConfirmModal, FormsModule],
  template: `
    <app-client-layout activeNav="profile" role="client" [hasHeaderSlot]="true">

      <!-- Fixed Header -->
      <app-location-header
        slot="header"
        [showLocation]="false"
        [hasNotification]="notificationService.clientUnreadCount() > 0"
        (notificationClick)="goToNotifications()"
      />

      <!-- Body -->
      <div class="profile-page">

        <!-- Avatar & Identity -->
        <section class="profile-page__hero">
          <div class="profile-page__avatar" aria-hidden="true">
            {{ avatarInitial }}
          </div>

          <!-- Name: click to edit -->
          @if (editingName()) {
            <div class="profile-page__name-edit">
              <input
                class="profile-page__name-input"
                type="text"
                [(ngModel)]="nameBuffer"
                placeholder="Votre nom complet ou prénom"
                maxlength="50"
                autofocus
                (keydown.enter)="saveName()"
                (keydown.escape)="cancelEdit()"
              />
              <div class="profile-page__name-edit-actions">
                <button type="button" class="profile-page__name-save" (click)="saveName()" [disabled]="saving()">
                  @if (saving()) {
                    <span>Enregistrement...</span>
                  } @else {
                    <span>✓ Enregistrer</span>
                  }
                </button>
                <button type="button" class="profile-page__name-cancel" (click)="cancelEdit()">
                  Annuler
                </button>
              </div>
            </div>
          } @else {
            <button type="button" class="profile-page__name-btn" (click)="startEdit()" title="Modifier le nom">
              <h1 class="profile-page__name">{{ displayName() }}</h1>
              <svg class="profile-page__name-edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          }

          <p class="profile-page__phone">{{ phone }}</p>
        </section>

        <!-- Stats Row -->
        <section class="profile-page__stats">
          <app-stat-card label="TICKETS">
            {{ totalTickets }}
          </app-stat-card>
          <app-stat-card label="SERVIS">
            {{ servedTickets }}
          </app-stat-card>
        </section>

        <!-- Menu Items -->
        <nav class="profile-page__menu" aria-label="Menu profil">
          <!-- Mes Salons Favoris -->
          <button type="button" class="profile-page__menu-item" (click)="goToFavorites()">
            <span class="profile-page__menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
            <span class="profile-page__menu-label">Mes Salons Favoris</span>
            <span class="profile-page__menu-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </button>

          <div class="profile-page__divider"></div>

          <!-- Mes Commandes -->
          <button type="button" class="profile-page__menu-item" (click)="goToOrders()">
            <span class="profile-page__menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </span>
            <span class="profile-page__menu-label">Mes Commandes</span>
            <span class="profile-page__menu-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </button>

          <div class="profile-page__divider"></div>

          <!-- Mes Proches -->
          <button type="button" class="profile-page__menu-item" (click)="goToRelatives()">
            <span class="profile-page__menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="17" y1="11" x2="23" y2="11"/>
              </svg>
            </span>
            <span class="profile-page__menu-label">Mes Proches</span>
            <span class="profile-page__menu-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </button>

          <div class="profile-page__divider"></div>

          <!-- Notifications -->
          <button type="button" class="profile-page__menu-item" (click)="goToNotifications()">
            <span class="profile-page__menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
            <span class="profile-page__menu-label">Notifications</span>
            @if (notificationService.clientUnreadCount() > 0) {
              <span class="profile-page__badge">{{ notificationService.clientUnreadCount() }}</span>
            }
            <span class="profile-page__menu-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </button>

          <div class="profile-page__divider"></div>

          <!-- Paramètres -->
          <button type="button" class="profile-page__menu-item" (click)="goToSettings()">
            <span class="profile-page__menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
              </svg>
            </span>
            <span class="profile-page__menu-label">Paramètres</span>
            <span class="profile-page__menu-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </button>

          <div class="profile-page__divider"></div>

          <!-- Aide & Support -->
          <button type="button" class="profile-page__menu-item" (click)="goToSupport()">
            <span class="profile-page__menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <span class="profile-page__menu-label">Aide &amp; Support</span>
            <span class="profile-page__menu-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </button>
        </nav>

        <!-- Logout Button -->
        <div class="profile-page__logout-wrap">
          <button type="button" class="profile-page__logout-btn" (click)="showLogoutModal.set(true)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Déconnexion</span>
          </button>
        </div>

      </div>
    </app-client-layout>

    <!-- Logout Confirmation Modal -->
    <app-confirm-modal
      [isOpen]="showLogoutModal()"
      title="Déconnexion"
      message="Êtes-vous sûr de vouloir vous déconnecter de votre compte ?"
      confirmLabel="Déconnexion"
      cancelLabel="Annuler"
      variant="danger"
      (confirm)="confirmLogout()"
      (cancel)="showLogoutModal.set(false)"
    />
  `,
  styleUrl: './client-profile-page.scss'
})
export class ClientProfilePage implements OnInit {
  private readonly router = inject(Router);
  private readonly ticketService = inject(TicketService);
  protected readonly notificationService = inject(NotificationService);
  private readonly auth = inject(AuthSessionService);

  protected readonly showLogoutModal = signal(false);
  protected readonly displayName = signal('Client Fotolou');
  protected readonly saving = signal(false);
  protected phone = '';

  // ── Inline Name Edit ─────────────────────────────────────
  protected readonly editingName = signal(false);
  protected nameBuffer = '';

  ngOnInit(): void {
    const user = this.auth.activeUser();
    if (user && user.name && user.name !== 'Mon Compte') {
      this.displayName.set(user.name);
      this.phone = user.phone;
    } else {
      this.displayName.set('Client Fotolou');
      this.phone = user?.phone || '';
    }
    this.ticketService.loadTickets();
  }

  protected startEdit(): void {
    this.nameBuffer = this.displayName();
    this.editingName.set(true);
  }

  protected async saveName(): Promise<void> {
    const trimmed = this.nameBuffer.trim();
    if (trimmed.length > 0) {
      const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      this.displayName.set(capitalized);
      this.saving.set(true);
      try {
        await this.auth.updateProfile({ name: capitalized });
      } catch (err) {
        console.warn('Erreur mise à jour profil:', err);
      } finally {
        this.saving.set(false);
      }
    }
    this.editingName.set(false);
  }

  protected cancelEdit(): void {
    this.editingName.set(false);
  }

  protected get avatarInitial(): string {
    return this.displayName().charAt(0).toUpperCase();
  }

  protected get totalTickets(): number {
    return this.ticketService.tickets().length;
  }

  protected get servedTickets(): number {
    return this.ticketService.tickets()
      .filter(t => t.status === 'served' || t.status === 'completed')
      .length;
  }

  protected goToFavorites(): void {
    this.router.navigate(['/client/favorites']);
  }

  protected goToOrders(): void {
    this.router.navigate(['/client/boutique/commandes']);
  }

  protected goToRelatives(): void {
    this.router.navigate(['/client/proches']);
  }

  protected goToNotifications(): void {
    this.router.navigate(['/client/notifications']);
  }

  protected goToSettings(): void {
    this.router.navigate(['/client/settings']);
  }

  protected goToSupport(): void {
    this.router.navigate(['/client/support']);
  }

  protected confirmLogout(): void {
    this.showLogoutModal.set(false);
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
