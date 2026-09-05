import { Component, inject, signal, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-desktop-restriction',
  template: `
    @if (isDesktopAppRoute()) {
      <aside class="desktop-alert" role="dialog" aria-modal="true" aria-labelledby="desktop-alert-title">
        <div class="desktop-alert__card">
          
          <!-- Brand Logo -->
          <div class="desktop-alert__brand">
            <img src="images/logoFotolou.png" alt="Fotolou" class="desktop-alert__logo" />
          </div>

          <!-- Mobile Illustration Icon -->
          <div class="desktop-alert__icon-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>

          <!-- Main Warning Content -->
          <div class="desktop-alert__content">
            <span class="desktop-alert__tag">Expérience Mobile &bull; PWA</span>
            <h2 id="desktop-alert-title">Application disponible uniquement sur mobile et tablette</h2>
            <p>
              Fotolou est conçue exclusivement pour être utilisée sur votre <strong>smartphone ou tablette</strong> afin de gérer vos tickets en temps réel et recevoir vos alertes au salon.
            </p>
          </div>

          <!-- QR Code & Instructions Box -->
          <div class="desktop-alert__qr-box">
            <div class="desktop-alert__qr-wrap">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https%3A%2F%2Ffotolou.vercel.app&color=1E5AF0&bgcolor=ffffff"
                alt="QR Code Fotolou Mobile"
                class="desktop-alert__qr-img"
              />
            </div>
            <div class="desktop-alert__qr-instructions">
              <strong>Scannez avec votre téléphone</strong>
              <span>Pointez l'appareil photo de votre smartphone pour ouvrir l'application immédiatement.</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="desktop-alert__actions">
            <button
              type="button"
              class="desktop-alert__btn desktop-alert__btn--primary"
              (click)="goToVitrine()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Voir la présentation (Site Vitrine)</span>
            </button>
          </div>

          <!-- Helpful Footer Note -->
          <div class="desktop-alert__note">
            <span>💡 Astuce : Vous pouvez aussi réduire la largeur de votre fenêtre pour tester en mode mobile.</span>
          </div>

        </div>
      </aside>
    }
  `,
  styleUrl: './desktop-restriction.scss'
})
export class DesktopRestriction {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly isDesktop = signal<boolean>(false);
  protected readonly currentUrl = signal<string>('');

  constructor() {
    if (this.isBrowser) {
      this.checkScreenSize();
      this.currentUrl.set(window.location.pathname);

      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          this.currentUrl.set(event.urlAfterRedirects || event.url);
          this.checkScreenSize();
        });
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (!this.isBrowser) return;
    // Considered desktop if screen width is 1024px or above
    this.isDesktop.set(window.innerWidth >= 1024);
  }

  protected isDesktopAppRoute(): boolean {
    if (!this.isDesktop()) return false;
    const url = this.currentUrl().split('?')[0].split('#')[0];
    // Vitrine pages and Admin portal are allowed on desktop
    if (url === '' || url === '/' || url === '/vitrine' || url === '/admin' || url.startsWith('/admin/')) {
      return false;
    }
    // Any other internal app route is blocked on large desktop screens
    return true;
  }

  protected goToVitrine(): void {
    this.router.navigate(['/vitrine']);
  }
}
