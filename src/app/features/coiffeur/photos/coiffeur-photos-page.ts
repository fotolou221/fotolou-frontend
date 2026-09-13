import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, catchError, of } from 'rxjs';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { AuthSessionService } from '../../auth/auth-session.service';
import { SalonService } from '../../../shared/services/salon.service';
import { API_CONFIG } from '../../../core/config/api.config';

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

        @if (saveError()) {
          <div class="photos-page__error-banner" role="alert">
            <span>⚠️</span>
            <p>{{ saveError() }}</p>
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
                <span class="photos-card__avatar-placeholder">{{ barberInitials() }}</span>
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
                [disabled]="isSaving()"
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
                  [disabled]="isSaving()"
                  (click)="removeProfilePhoto()"
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
                [disabled]="isSaving()"
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
            [disabled]="isSaving()"
            (click)="savePhotos()"
          >
            @if (isSaving()) {
              <span>Enregistrement des photos</span><span class="loading-dots" aria-hidden="true"></span>
            } @else {
              <span>Enregistrer les photos</span>
            }
          </button>
        </div>

      </div>
    </app-client-layout>
  `,
  styleUrl: './coiffeur-photos-page.scss'
})
export class CoiffeurPhotosPage implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  protected readonly auth = inject(AuthSessionService);
  protected readonly salonService = inject(SalonService);

  protected readonly profilePreview = signal<string | null>(null);
  protected readonly selectedProfileFile = signal<File | null>(null);

  protected readonly salonPreview = signal<string | null>(null);
  protected readonly selectedSalonFile = signal<File | null>(null);

  protected readonly isSaving = signal<boolean>(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly showSuccess = signal<boolean>(false);

  protected readonly defaultSalonBanner = 'images/salons/king-barber-cover.png';

  protected readonly currentSalon = computed(() => {
    const user = this.auth.currentUser();
    const salonId = user?.salonId?.toString() || user?.salonSlug;
    if (salonId) {
      return (
        this.salonService.salons().find(
          (salon) => salon.id === salonId || salon.slug === salonId || salon.numericId?.toString() === salonId
        ) || null
      );
    }
    return this.salonService.salons()[0] || null;
  });

  protected readonly barberInitials = computed(() => {
    const user = this.auth.activeUser();
    const name = user?.name || 'Coiffeur';
    return name.slice(0, 2).toUpperCase();
  });

  ngOnInit(): void {
    this.salonService.loadSalons();
    // Initialize previews from active session and salon
    const user = this.auth.currentUser();
    if (user?.avatarUrl) {
      this.profilePreview.set(user.avatarUrl);
    }
    const salon = this.currentSalon();
    if (salon?.coverUrl) {
      this.salonPreview.set(salon.coverUrl);
    }
  }

  protected onProfileFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedProfileFile.set(file);
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
      this.selectedSalonFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.salonPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  protected removeProfilePhoto(): void {
    this.profilePreview.set(null);
    this.selectedProfileFile.set(null);
  }

  protected async savePhotos(): Promise<void> {
    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      let finalAvatarUrl = this.profilePreview();
      let finalCoverUrl = this.salonPreview();

      // 1. Upload profile avatar if a new file was chosen
      const profileFile = this.selectedProfileFile();
      if (profileFile) {
        const formData = new FormData();
        formData.append('file', profileFile);
        formData.append('folder', 'avatars');

        const uploadRes = await firstValueFrom(
          this.http.post<any>(`${API_CONFIG.baseUrl}/storage/upload`, formData)
        );
        if (uploadRes && uploadRes.url) {
          finalAvatarUrl = this.normalizeUrl(uploadRes.url);
        }
      }

      // Update user profile in AuthSessionService (updates local signals and calls /api/account/profile)
      if (finalAvatarUrl !== this.auth.currentUser()?.avatarUrl) {
        await this.auth.updateProfile({ avatarUrl: finalAvatarUrl || '' });
      }

      // 2. Upload salon cover if a new file was chosen
      const salonFile = this.selectedSalonFile();
      const salon = this.currentSalon();
      if (salonFile) {
        const formData = new FormData();
        formData.append('file', salonFile);
        formData.append('folder', 'salons');

        const uploadRes = await firstValueFrom(
          this.http.post<any>(`${API_CONFIG.baseUrl}/storage/upload`, formData)
        );
        if (uploadRes && uploadRes.url) {
          finalCoverUrl = this.normalizeUrl(uploadRes.url);
        }
      }

      // Update salon in backend if coverUrl changed
      if (salon && finalCoverUrl && finalCoverUrl !== salon.coverUrl) {
        const salonApiId = salon.numericId || salon.id;
        await firstValueFrom(
          this.http.patch(`${API_CONFIG.baseUrl}/salons/${salonApiId}`, {
            id: typeof salonApiId === 'number' ? salonApiId : undefined,
            coverUrl: finalCoverUrl
          }).pipe(
            catchError((err) => {
              console.warn('[CoiffeurPhotosPage] Salon patch error, continuing:', err);
              return of(null);
            })
          )
        );

        // Update salonService signal immediately so other views reflect the new cover
        this.salonService.salons.update((list) =>
          list.map((s) => (s.id === salon.id || s.numericId === salon.numericId ? { ...s, coverUrl: finalCoverUrl! } : s))
        );
      }

      this.isSaving.set(false);
      this.showSuccess.set(true);

      globalThis.setTimeout(() => {
        this.showSuccess.set(false);
        this.router.navigate(['/coiffeur/profile']);
      }, 1400);

    } catch (err: any) {
      this.isSaving.set(false);
      console.error('[CoiffeurPhotosPage] Save photos error:', err);
      this.saveError.set('Impossible d\'enregistrer les photos. Vérifiez votre connexion internet et réessayez.');
    }
  }

  private normalizeUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    const apiOrigin = API_CONFIG.baseUrl.replace(/\/api\/?$/, '');
    return apiOrigin + (url.startsWith('/') ? url : '/' + url);
  }
}
