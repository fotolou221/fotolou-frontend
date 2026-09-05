import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { AdminDataService } from '../../services/admin-data.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="admin-auth">
      
      <!-- ══════════════════════════════════════════════════════════
           LEFT COLUMN: Brand & Visual Showcase
      ══════════════════════════════════════════════════════════ -->
      <div class="admin-auth__visual">
        <div class="admin-auth__visual-bg-glow"></div>
        
        <div class="admin-auth__visual-content">
          
          <!-- Top Brand Header -->
          <div class="admin-auth__brand">
            <img src="images/logoFotolou.png" alt="Fotolou" class="admin-auth__brand-logo" />
            <div>
              <span class="admin-auth__brand-name">Fotolou</span>
              <span class="admin-auth__brand-badge">ADMIN CONSOLE</span>
            </div>
          </div>

          <!-- Hero Punchline -->
          <div class="admin-auth__hero-copy">
            <h2>Pilotez l'ensemble de l'activité Fotolou à Dakar</h2>
            <p>
              Supervisez en direct les files d'attente des salons, gérez les coiffeurs, traitez les commandes boutique et configurez votre plateforme en temps réel.
            </p>
          </div>

          <!-- Live Metric Highlights -->
          <div class="admin-auth__highlights">
            <div class="admin-highlight-card">
              <div class="admin-highlight-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div class="admin-highlight-card__info">
                <strong>+500 Salons</strong>
                <span>Référencés à Dakar</span>
              </div>
            </div>

            <div class="admin-highlight-card">
              <div class="admin-highlight-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="15" x2="10" y2="15"/>
                </svg>
              </div>
              <div class="admin-highlight-card__info">
                <strong>Temps Réel</strong>
                <span>Gestion de tickets live</span>
              </div>
            </div>

            <div class="admin-highlight-card">
              <div class="admin-highlight-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <div class="admin-highlight-card__info">
                <strong>E-Commerce</strong>
                <span>Boutique &amp; Commandes</span>
              </div>
            </div>
          </div>

          <!-- Footer Assurance Note -->
          <div class="admin-auth__visual-footer">
            <div class="admin-auth__security-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Connexion sécurisée SSL 256-bit &bull; Serveur Dakar</span>
            </div>
          </div>

        </div>
      </div>


      <!-- ══════════════════════════════════════════════════════════
           RIGHT COLUMN: Full-Height Clean Login Form
      ══════════════════════════════════════════════════════════ -->
      <div class="admin-auth__form-container">
        
        <div class="admin-auth__form-box">
          
          <!-- Form Header -->
          <div class="admin-auth__form-header">
            <span class="admin-auth__subtag">AUTHENTIFICATION ADMINISTRATEUR</span>
            <h1>Bienvenue sur la Console</h1>
            <p>Saisissez vos identifiants pour vous connecter à votre espace de gestion.</p>
          </div>

          <!-- Quick Demo Account Shortcut Pill -->
          <div class="admin-auth__demo-banner">
            <div class="admin-auth__demo-text">
              <span class="admin-auth__demo-dot"></span>
              <span>Identifiants démo : <strong>admin&#64;fotolou.sn</strong> / <strong>fotolou2026</strong></span>
            </div>
            <button type="button" class="admin-auth__demo-btn" (click)="fillDemoCredentials()">
              Remplir automatiquement
            </button>
          </div>

          <!-- Error Alert -->
          @if (errorMessage()) {
            <div class="admin-auth__error-alert" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Authentication Form -->
          <form (ngSubmit)="onSubmit()" class="admin-auth__form">
            
            <div class="admin-auth__field">
              <label for="admin-email">Identifiant ou Adresse E-mail</label>
              <div class="admin-auth__input-wrap">
                <span class="admin-auth__input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  id="admin-email"
                  name="email"
                  type="text"
                  [(ngModel)]="email"
                  placeholder="admin@fotolou.sn"
                  required
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="admin-auth__field">
              <div class="admin-auth__label-row">
                <label for="admin-password">Mot de passe</label>
              </div>
              <div class="admin-auth__input-wrap">
                <span class="admin-auth__input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="admin-password"
                  name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="admin-auth__toggle-pass"
                  (click)="showPassword.set(!showPassword())"
                  [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                >
                  @if (showPassword()) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="admin-auth__submit-btn"
              [disabled]="loading()"
            >
              @if (loading()) {
                <span class="admin-auth__spinner"></span>
                <span>Vérification des accès...</span>
              } @else {
                <span>Se connecter au tableau de bord</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              }
            </button>
          </form>

          <!-- Back to Vitrine -->
          <div class="admin-auth__footer-links">
            <a routerLink="/" class="admin-auth__back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              <span>Retourner au site public Fotolou</span>
            </a>
          </div>

        </div>

      </div>

    </div>
  `,
  styleUrl: './admin-login-page.scss'
})
export class AdminLoginPage {
  private readonly auth = inject(AdminAuthService);
  private readonly adminDataService = inject(AdminDataService);
  private readonly router = inject(Router);

  protected email = 'admin@fotolou.sn';
  protected password = 'admin_fotolou_2026';
  protected readonly showPassword = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  protected fillDemoCredentials(): void {
    this.email = 'admin@fotolou.sn';
    this.password = 'admin_fotolou_2026';
  }

  protected onSubmit(): void {
    this.errorMessage.set('');
    this.loading.set(true);

    this.auth.login(this.email, this.password).subscribe((res) => {
      this.loading.set(false);

      if (res.success) {
        this.adminDataService.loadFromBackend();
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.errorMessage.set(res.message || 'Identifiants incorrects.');
      }
    });
  }
}
