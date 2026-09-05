import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthSessionService } from '../../../features/auth/auth-session.service';

export type BottomNavItem = 'home' | 'tickets' | 'shop' | 'profile';
export type UserRole = 'client' | 'coiffeur';

interface NavItem {
  readonly id: BottomNavItem;
  readonly label: string;
  readonly route: string;
}

@Component({
  selector: 'app-bottom-navigation',
  imports: [RouterLink],
  template: `
    <nav class="bottom-navigation" aria-label="Navigation principale">
      @for (item of currentItems; track item.id) {
        <a
          class="bottom-navigation__item"
          [class.bottom-navigation__item--active]="activeItem === item.id"
          [routerLink]="item.route"
        >
          <span class="bottom-navigation__icon" [attr.data-icon]="item.id" aria-hidden="true">
            @switch (item.id) {
              @case ('home') {
                <svg viewBox="0 0 24 24">
                  <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />
                </svg>
              }
              @case ('tickets') {
                <svg viewBox="0 0 24 24">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  <path d="M12 5v2" />
                  <path d="M12 11v2" />
                  <path d="M12 17v2" />
                </svg>
              }
              @case ('shop') {
                <svg viewBox="0 0 24 24">
                  <path d="M5 10h14l-1 10H6L5 10Z" />
                  <path d="M4 10 6 5h12l2 5" />
                  <path d="M9 10V5M15 10V5" />
                </svg>
              }
              @case ('profile') {
                <svg viewBox="0 0 24 24">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                  <path d="M5 21a7 7 0 0 1 14 0" />
                </svg>
              }
            }
          </span>
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './bottom-navigation.scss'
})
export class BottomNavigation {
  @Input() activeItem: BottomNavItem = 'home';
  @Input() role?: UserRole;

  private readonly auth = inject(AuthSessionService);

  protected get currentRole(): UserRole {
    return this.role || this.auth.activeRole();
  }

  protected get currentItems(): readonly NavItem[] {
    if (this.currentRole === 'coiffeur') {
      return [
        { id: 'home', label: 'Accueil', route: '/coiffeur/home' },
        { id: 'tickets', label: 'Mes tickets', route: '/coiffeur/tickets' },
        { id: 'shop', label: 'Boutique', route: '/client/boutique' },
        { id: 'profile', label: 'Profil', route: '/coiffeur/profile' }
      ];
    }

    return [
      { id: 'home', label: 'Accueil', route: '/client/home' },
      { id: 'tickets', label: 'Mes tickets', route: '/client/tickets' },
      { id: 'shop', label: 'Boutique', route: '/client/boutique' },
      { id: 'profile', label: 'Profil', route: '/client/profile' }
    ];
  }
}
