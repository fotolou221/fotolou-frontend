import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ThemeService } from '../../../shared/services/theme.service';
import { PwaService } from '../../../shared/services/pwa.service';
import { AuthSessionService } from '../../auth/auth-session.service';

@Component({
  selector: 'app-settings-page',
  imports: [
    ClientLayout,
    PageHeader
  ],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="false">
      <!-- Fixed Header Slot -->
      <app-page-header
        slot="header"
        title="Paramètres"
        [backRoute]="backRoute"
      />

      <!-- Content -->
      <div class="settings-page__content">
        <!-- Appearance Section -->
        <section class="settings-section">
          <h2 class="settings-section__title">Apparence</h2>
          <p class="settings-section__subtitle">Choisissez le mode d'affichage de l'application.</p>

          <div class="settings-theme-selector">
            <button
              type="button"
              class="settings-theme-btn"
              [class.settings-theme-btn--active]="themeService.theme() === 'light'"
              (click)="themeService.setTheme('light')"
            >
              <svg class="settings-theme-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <span>Clair</span>
            </button>

            <button
              type="button"
              class="settings-theme-btn"
              [class.settings-theme-btn--active]="themeService.theme() === 'dark'"
              (click)="themeService.setTheme('dark')"
            >
              <svg class="settings-theme-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <span>Sombre</span>
            </button>

            <button
              type="button"
              class="settings-theme-btn"
              [class.settings-theme-btn--active]="themeService.theme() === 'system'"
              (click)="themeService.setTheme('system')"
            >
              <svg class="settings-theme-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span>Système</span>
            </button>
          </div>
        </section>

        <!-- Application Mobile (PWA) Section -->
        <section class="settings-section">
          <h2 class="settings-section__title">Application Mobile</h2>
          <p class="settings-section__subtitle">Accédez à Fotolou directement depuis votre écran d'accueil.</p>

          <div class="settings-card">
            @if (pwa.isStandalone()) {
              <div class="settings-row">
                <div class="settings-row__info">
                  <strong>Mode Application</strong>
                  <span>Vous utilisez Fotolou en mode autonome sur votre téléphone.</span>
                </div>
                <span class="settings-badge settings-badge--success">✓ Installée</span>
              </div>
            } @else {
              <button type="button" class="settings-row settings-row--link" (click)="openInstall()">
                <div class="settings-row__info">
                  <strong>📱 Installer sur l'écran d'accueil</strong>
                  <span>Accès rapide, plein écran et fluidité maximale.</span>
                </div>
                <svg class="settings-row__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            }
          </div>
        </section>

        <!-- Notifications Section -->
        <section class="settings-section">
          <h2 class="settings-section__title">Notifications</h2>

          <div class="settings-card">
            <div class="settings-row">
              <div class="settings-row__info">
                <strong>Alertes de ticket &amp; file</strong>
                <span>Recevez une alerte lorsque votre tour approche.</span>
              </div>
              <button
                type="button"
                class="settings-toggle"
                [class.settings-toggle--active]="ticketAlerts()"
                (click)="ticketAlerts.update(v => !v)"
              >
                <span class="settings-toggle__thumb"></span>
              </button>
            </div>

            <div class="settings-divider"></div>

            <div class="settings-row">
              <div class="settings-row__info">
                <strong>Offres &amp; Promotions</strong>
                <span>Notifications sur les nouveaux produits et réductions.</span>
              </div>
              <button
                type="button"
                class="settings-toggle"
                [class.settings-toggle--active]="promoAlerts()"
                (click)="promoAlerts.update(v => !v)"
              >
                <span class="settings-toggle__thumb"></span>
              </button>
            </div>
          </div>
        </section>

        <!-- Language & Region -->
        <section class="settings-section">
          <h2 class="settings-section__title">Langue &amp; Région</h2>

          <div class="settings-card">
            <div class="settings-row">
              <div class="settings-row__info">
                <strong>Langue principale</strong>
                <span>Français (Sénégal) 🇸🇳</span>
              </div>
              <span class="settings-badge">Par défaut</span>
            </div>
          </div>
        </section>

        <!-- Photos du Salon (coiffeur only) -->
        @if (auth.activeRole() === 'coiffeur') {
          <section class="settings-section">
            <h2 class="settings-section__title">Photos &amp; Visuels du Salon</h2>

            <div class="settings-card">
              <button type="button" class="settings-row settings-row--link" (click)="goToPhotos()">
                <div class="settings-row__info">
                  <strong>Photo de profil &amp; bannière salon</strong>
                  <span>Mettre à jour vos photos de présentation.</span>
                </div>
                <svg class="settings-row__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </section>
        }

        <!-- Security -->
        <section class="settings-section">
          <h2 class="settings-section__title">Sécurité</h2>

          <div class="settings-card">
            <div class="settings-row">
              <div class="settings-row__info">
                <strong>Numéro de téléphone</strong>
                <span>{{ auth.activeUser().phone }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </app-client-layout>
  `,
  styleUrl: './settings-page.scss'
})
export class SettingsPage {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthSessionService);
  protected readonly themeService = inject(ThemeService);
  protected readonly pwa = inject(PwaService);

  protected readonly ticketAlerts = signal(true);
  protected readonly promoAlerts = signal(true);

  protected get backRoute(): string {
    return this.auth.activeRole() === 'coiffeur' ? '/coiffeur/profile' : '/client/profile';
  }

  protected goToPhotos(): void {
    this.router.navigate(['/coiffeur/settings/photos']);
  }

  protected openInstall(): void {
    this.pwa.showBanner.set(true);
    this.pwa.promptInstall();
  }
}
