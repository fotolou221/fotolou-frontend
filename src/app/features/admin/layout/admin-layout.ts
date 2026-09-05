import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminConfirmService } from '../services/admin-confirm.service';
import { AdminConfirmDialogComponent } from '../components/admin-confirm-dialog/admin-confirm-dialog';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterOutlet, RouterLinkActive, AdminConfirmDialogComponent],
  template: `
    <div class="admin-shell" [class.admin-shell--collapsed]="sidebarCollapsed()">
      
      <!-- ══════════════════════════════════════════════════════════
           SIDEBAR
      ══════════════════════════════════════════════════════════ -->
      <aside class="admin-sidebar">
        <div class="admin-sidebar__header">
          <a routerLink="/admin/dashboard" class="admin-sidebar__brand">
            <img src="images/logoFotolou.png" alt="Fotolou" class="admin-sidebar__logo" />
            @if (!sidebarCollapsed()) {
              <div class="admin-sidebar__brand-text">
                <span class="admin-sidebar__title">Fotolou</span>
                <span class="admin-sidebar__sub">ADMIN CONSOLE</span>
              </div>
            }
          </a>
          <button
            type="button"
            class="admin-sidebar__toggle-btn"
            (click)="sidebarCollapsed.set(!sidebarCollapsed())"
            [attr.aria-label]="sidebarCollapsed() ? 'Agrandir le menu' : 'Réduire le menu'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </div>

        <nav class="admin-sidebar__nav" aria-label="Menu administration">
          <span class="admin-sidebar__section-title">PILOTAGE</span>
          
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="admin-nav-item">
            <span class="admin-nav-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </span>
            @if (!sidebarCollapsed()) {
              <span class="admin-nav-item__label">Tableau de bord</span>
            }
          </a>

          <a routerLink="/admin/salons" routerLinkActive="active" class="admin-nav-item">
            <span class="admin-nav-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            @if (!sidebarCollapsed()) {
              <span class="admin-nav-item__label">Salons Partenaires</span>
            }
          </a>

          <a routerLink="/admin/tickets" routerLinkActive="active" class="admin-nav-item">
            <span class="admin-nav-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>
            </span>
            @if (!sidebarCollapsed()) {
              <span class="admin-nav-item__label">Tickets &amp; Files d'attente</span>
            }
          </a>

          <span class="admin-sidebar__section-title">COMMERCE</span>

          <a routerLink="/admin/boutique" routerLinkActive="active" class="admin-nav-item">
            <span class="admin-nav-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </span>
            @if (!sidebarCollapsed()) {
              <span class="admin-nav-item__label">Boutique &amp; Produits</span>
            }
          </a>

          <a routerLink="/admin/categories" routerLinkActive="active" class="admin-nav-item">
            <span class="admin-nav-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><circle cx="6.5" cy="17.5" r="3.5"/></svg>
            </span>
            @if (!sidebarCollapsed()) {
              <span class="admin-nav-item__label">Catégories Boutique</span>
            }
          </a>

          <a routerLink="/admin/commandes" routerLinkActive="active" class="admin-nav-item">
            <span class="admin-nav-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </span>
            @if (!sidebarCollapsed()) {
              <span class="admin-nav-item__label">Commandes Clients</span>
            }
          </a>

          <a routerLink="/admin/utilisateurs" routerLinkActive="active" class="admin-nav-item">
            <span class="admin-nav-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            @if (!sidebarCollapsed()) {
              <span class="admin-nav-item__label">Utilisateurs Clients</span>
            }
          </a>

          <span class="admin-sidebar__section-title">SYSTÈME</span>

          <a routerLink="/admin/settings" routerLinkActive="active" class="admin-nav-item">
            <span class="admin-nav-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>
            @if (!sidebarCollapsed()) {
              <span class="admin-nav-item__label">Paramètres Système</span>
            }
          </a>
        </nav>

        <!-- User Profile & Logout with confirmation -->
        <div class="admin-sidebar__footer">
          <div class="admin-sidebar__user">
            <div class="admin-sidebar__avatar">AD</div>
            @if (!sidebarCollapsed()) {
              <div class="admin-sidebar__user-info">
                <strong>{{ auth.currentAdmin()?.name || 'Administrateur' }}</strong>
                <span>{{ auth.currentAdmin()?.email || 'admin@fotolou.sn' }}</span>
              </div>
            }
          </div>
          <button
            type="button"
            class="admin-sidebar__logout-btn"
            (click)="onLogout()"
            title="Déconnexion"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- ══════════════════════════════════════════════════════════
           MAIN VIEWPORT & TOPBAR
      ══════════════════════════════════════════════════════════ -->
      <div class="admin-main">
        
        <!-- Admin TopBar -->
        <header class="admin-topbar">
          <div class="admin-topbar__left">
            <span class="admin-topbar__status-badge">
              <span class="admin-topbar__status-dot"></span>
              <span>Serveur Opérationnel (Dakar)</span>
            </span>
          </div>

          <div class="admin-topbar__right">
            <a routerLink="/vitrine" class="admin-topbar__site-link" target="_blank" title="Ouvrir le site vitrine">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              <span>Site Vitrine</span>
            </a>

            <div class="admin-topbar__divider"></div>

            <div class="admin-topbar__admin-chip">
              <div class="admin-topbar__chip-avatar">AD</div>
              <div class="admin-topbar__chip-details">
                <strong>{{ auth.currentAdmin()?.name }}</strong>
                <span>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Dynamic Content Router Outlet -->
        <main class="admin-content">
          <router-outlet />
        </main>

      </div>

      <!-- Global Admin Confirmation Dialog -->
      <app-admin-confirm-dialog />

    </div>
  `,
  styleUrl: './admin-layout.scss'
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AdminAuthService);
  protected readonly confirmService = inject(AdminConfirmService);
  protected readonly sidebarCollapsed = signal<boolean>(false);

  protected async onLogout(): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Confirmation de déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter de votre console d\'administration Fotolou ?',
      confirmLabel: 'Se déconnecter',
      cancelLabel: 'Rester connecté',
      variant: 'danger'
    });

    if (confirmed) {
      this.auth.logout();
    }
  }
}
