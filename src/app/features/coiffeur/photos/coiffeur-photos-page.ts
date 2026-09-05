import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-coiffeur-photos-page',
  imports: [
    ClientLayout,
    PageHeader
  ],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="false">
      <!-- Fixed Header Slot -->
      <app-page-header
        slot="header"
        title="Photos du Salon & Profil"
        backRoute="/coiffeur/profile"
      />

      <!-- Main Content -->
      <div class="photos-page__content">

        @if (showSuccess()) {
          <div class="photos-page__success-banner">
            <span>✅</span>
            <p>Les photos de votre profil et de votre salon ont été mises à jour avec succès !</p>
          </div>
        }

        <!-- Section 1: Photo de Profil Coiffeur -->
        <section class="photos-card">
          <h2 class="photos-card__title">Photo de profil coiffeur</h2>
          <p class="photos-card__subtitle">
            Cette photo vous identifie auprès de votre équipe et de vos clients.
          </p>

          <div class="photos-card__avatar-preview-wrap">
            <div class="photos-card__avatar-preview">
              @if (profilePreview()) {
                <img [src]="profilePreview()" alt="Aperçu photo de profil" />
              } @else {
                <span class="photos-card__avatar-placeholder">KB</span>
              }
            </div>

            <div class="photos-card__actions">
              <input
                #profileInput
                type="file"
                accept="image/*"
                (change)="onProfileFileSelected($event)"
                hidden
              />

              <button
                type="button"
                class="photos-btn photos-btn--primary"
                (click)="profileInput.click()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Changer la photo de profil</span>
              </button>

              @if (profilePreview()) {
                <button
                  type="button"
                  class="photos-btn photos-btn--text"
                  (click)="profilePreview.set(null)"
                >
                  Supprimer
                </button>
              }
            </div>
          </div>
        </section>

        <!-- Section 2: Photo de Couverture du Salon -->
        <section class="photos-card">
          <h2 class="photos-card__title">Photo de couverture du salon</h2>
          <p class="photos-card__subtitle">
            Cette image illustre le salon en arrière-plan sur votre tableau de bord.
          </p>

          <div class="photos-card__banner-preview-wrap">
            <div class="photos-card__banner-preview">
              <img [src]="salonPreview() || defaultSalonBanner" alt="Aperçu bannière salon" />
              <div class="photos-card__banner-overlay"></div>
            </div>

            <div class="photos-card__actions">
              <input
                #salonInput
                type="file"
                accept="image/*"
                (change)="onSalonFileSelected($event)"
                hidden
              />

              <button
                type="button"
                class="photos-btn photos-btn--primary"
                (click)="salonInput.click()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Changer la photo du salon</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Save Action Footer -->
        <div class="photos-page__save-wrap">
          <button
            type="button"
            class="photos-page__save-btn"
            (click)="savePhotos()"
          >
            Enregistrer les photos
          </button>
        </div>

      </div>
    </app-client-layout>
  `,
  styleUrl: './coiffeur-photos-page.scss'
})
export class CoiffeurPhotosPage {
  private readonly router = inject(Router);

  protected readonly profilePreview = signal<string | null>(null);
  protected readonly salonPreview = signal<string | null>(null);
  protected readonly showSuccess = signal(false);

  protected readonly defaultSalonBanner = 'images/salons/king-barber-cover.png';

  protected onProfileFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profilePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  protected onSalonFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.salonPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  protected savePhotos(): void {
    this.showSuccess.set(true);
    globalThis.setTimeout(() => {
      this.showSuccess.set(false);
      this.router.navigate(['/coiffeur/profile']);
    }, 1500);
  }
}
