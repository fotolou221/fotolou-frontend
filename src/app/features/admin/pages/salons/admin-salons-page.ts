import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { AdminBadge } from '../../components/admin-badge/admin-badge';
import { AdminModal } from '../../components/admin-modal/admin-modal';
import { AdminImageUploader } from '../../components/admin-image-uploader/admin-image-uploader';
import { AdminPagination } from '../../components/admin-pagination/admin-pagination';
import { AdminViewToggle, AdminViewMode } from '../../components/admin-view-toggle/admin-view-toggle';
import { Salon } from '../../../../shared/models/salon';
import { AdminConfirmService } from '../../services/admin-confirm.service';

@Component({
  selector: 'app-admin-salons-page',
  imports: [FormsModule, AdminBadge, AdminModal, AdminImageUploader, AdminPagination, AdminViewToggle],
  template: `
    <div class="admin-page">
      
      <!-- Page Header -->
      <div class="admin-page__header">
        <div>
          <h1>Gestion des Salons Partenaires</h1>
          <p>Supervisez, ajoutez et modifiez les salons de coiffure référencés sur Fotolou.</p>
        </div>
        <button type="button" class="admin-btn admin-btn--primary" (click)="openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Nouveau Salon</span>
        </button>
      </div>

      <!-- Filter / Search & View Switcher Toolbar -->
      <div class="admin-toolbar">
        <div class="admin-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="currentPage.set(1)"
            placeholder="Rechercher un salon par nom ou quartier..."
          />
        </div>

        <div class="admin-toolbar__right">
          <div class="admin-filter-group">
            <select [(ngModel)]="statusFilter" (ngModelChange)="currentPage.set(1)">
              <option value="all">Tous les statuts</option>
              <option value="open">Ouvert</option>
              <option value="closed">Fermé</option>
            </select>
          </div>

          <app-admin-view-toggle [(viewMode)]="viewMode" />
        </div>
      </div>

      <!-- Salons View: Table Mode -->
      @if (viewMode === 'table') {
        <div class="admin-card">
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Salon &amp; Coiffeur Propriétaire</th>
                  <th>Quartier &bull; Ville</th>
                  <th>Contact</th>
                  <th>Personnes en attente</th>
                  <th>Statut</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (salon of paginatedSalons(); track salon.id) {
                  <tr>
                    <td>
                      <div class="admin-table__item-with-img">
                        <img [src]="salon.avatarUrl || salon.coverUrl" [alt]="salon.name" class="admin-table__thumb" />
                        <div>
                          <strong>{{ salon.name }}</strong>
                          <span class="admin-table__subtext">
                            Propriétaire : {{ salon.ownerName || salon.coiffeurName || 'Non renseigné' }}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{{ salon.district || salon.location }}</td>
                    <td>{{ salon.phone || '+221 77 000 00 00' }}</td>
                    <td>
                      <span class="admin-badge admin-badge--primary">{{ salon.peopleWaiting }} en file</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="admin-status-toggle"
                        (click)="data.toggleSalonStatus(salon.id)"
                        [title]="salon.status === 'open' ? 'Cliquer pour fermer' : 'Cliquer pour ouvrir'"
                      >
                        <app-admin-badge [variant]="salon.status === 'open' ? 'success' : 'danger'">
                          {{ salon.status === 'open' ? 'Ouvert' : 'Fermé' }}
                        </app-admin-badge>
                      </button>
                    </td>
                    <td style="text-align: right;">
                      <div class="admin-table__actions">
                        <button type="button" class="admin-icon-btn" (click)="openEditModal(salon)" title="Modifier">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="deleteSalon(salon)" title="Supprimer">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="admin-table__empty">
                      Aucun salon ne correspond à votre recherche.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <app-admin-pagination
            [totalItems]="filteredSalons().length"
            [pageSize]="pageSize()"
            [currentPage]="currentPage()"
            (pageChange)="currentPage.set($event)"
            (pageSizeChange)="pageSize.set($event)"
          />
        </div>
      }

      <!-- Salons View: Grid Mode -->
      @if (viewMode === 'grid') {
        <div class="admin-grid-cards">
          @for (salon of paginatedSalons(); track salon.id) {
            <div class="admin-grid-card">
              <div class="admin-grid-card__cover">
                <img [src]="salon.coverUrl || salon.avatarUrl" [alt]="salon.name" />
                <div class="admin-grid-card__status-tag">
                  <app-admin-badge [variant]="salon.status === 'open' ? 'success' : 'danger'">
                    {{ salon.status === 'open' ? 'Ouvert' : 'Fermé' }}
                  </app-admin-badge>
                </div>
              </div>

              <div class="admin-grid-card__body">
                <div class="admin-grid-card__header">
                  <h3>{{ salon.name }}</h3>
                  <span class="admin-grid-card__badge">{{ salon.peopleWaiting }} pers. en file</span>
                </div>
                <div class="admin-grid-card__meta">
                  <span>{{ salon.district || salon.location }}</span>
                  <span><strong>Propriétaire :</strong> {{ salon.ownerName || 'Coiffeur' }}</span>
                  <span>{{ salon.phone || '+221 77 000 00 00' }}</span>
                </div>
              </div>

              <div class="admin-grid-card__footer">
                <button
                  type="button"
                  class="admin-btn-secondary"
                  (click)="data.toggleSalonStatus(salon.id)"
                >
                  {{ salon.status === 'open' ? 'Fermer' : 'Ouvrir' }}
                </button>

                <div class="admin-grid-card__actions">
                  <button type="button" class="admin-icon-btn" (click)="openEditModal(salon)" title="Modifier">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                  <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="deleteSalon(salon)" title="Supprimer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="admin-table__empty" style="grid-column: 1 / -1; background: #ffffff; border-radius: 16px; padding: 40px; text-align: center;">
              Aucun salon ne correspond à votre recherche.
            </div>
          }
        </div>

        <div class="admin-card" style="margin-top: 16px;">
          <app-admin-pagination
            [totalItems]="filteredSalons().length"
            [pageSize]="pageSize()"
            [currentPage]="currentPage()"
            (pageChange)="currentPage.set($event)"
            (pageSizeChange)="pageSize.set($event)"
          />
        </div>
      }

      <!-- Add / Edit Salon Multi-Step Modal (2 Simple Steps) -->
      <app-admin-modal
        [title]="editingSalonId() ? 'Modifier le Salon' : 'Nouveau Salon Partenaire (Étape ' + currentStep() + '/2)'"
        [isOpen]="isModalOpen()"
        (close)="isModalOpen.set(false)"
      >
        <!-- Stepper Navigation Header (2 Steps) -->
        <div class="admin-stepper" style="max-width: 480px; margin: 0 auto 20px;">
          <button
            type="button"
            class="admin-stepper__step"
            [class.admin-stepper__step--active]="currentStep() === 1"
            [class.admin-stepper__step--done]="currentStep() > 1"
            (click)="currentStep.set(1)"
          >
            <span class="admin-stepper__circle">1</span>
            <span class="admin-stepper__label">Coiffeur Propriétaire</span>
          </button>
          <div class="admin-stepper__line" [class.admin-stepper__line--done]="currentStep() > 1"></div>
          <button
            type="button"
            class="admin-stepper__step"
            [class.admin-stepper__step--active]="currentStep() === 2"
            (click)="nextStep()"
          >
            <span class="admin-stepper__circle">2</span>
            <span class="admin-stepper__label">Salon &amp; Position GPS</span>
          </button>
        </div>

        <form class="admin-form" (ngSubmit)="currentStep() === 2 ? saveSalon() : nextStep()">
          
          <!-- ── ÉTAPE 1 : Coiffeur Propriétaire (Simple & Épuré) ── -->
          @if (currentStep() === 1) {
            <div class="step-container">
              <div class="step-title-box">
                <h3>Profil du Coiffeur Propriétaire</h3>
                <p>Renseignez les coordonnées directes du coiffeur propriétaire.</p>
              </div>

              <div class="admin-form__row">
                <div class="admin-form__field">
                  <label>Prénom *</label>
                  <input type="text" [(ngModel)]="formOwnerFirstName" name="ownerFirstName" required placeholder="Ex: Abdoulaye" />
                </div>
                <div class="admin-form__field">
                  <label>Nom *</label>
                  <input type="text" [(ngModel)]="formOwnerLastName" name="ownerLastName" required placeholder="Ex: Diouf" />
                </div>
              </div>

              <div class="admin-form__field">
                <label>Numéro de téléphone direct (WhatsApp / Appel) *</label>
                <input type="tel" [(ngModel)]="formOwnerPhone" name="ownerPhone" required placeholder="+221 77 123 45 67" />
              </div>

              <app-admin-image-uploader
                label="Photo de profil du coiffeur"
                [(imageUrl)]="formOwnerAvatarUrl"
              />
            </div>
          }

          <!-- ── ÉTAPE 2 : Salon & Localisation GPS Réelle ── -->
          @if (currentStep() === 2) {
            <div class="step-container">
              <div class="step-title-box">
                <h3>Établissement &amp; Position GPS Réelle</h3>
                <p>Nom, visuel et géolocalisation exacte du salon sur la carte.</p>
              </div>

              <div class="admin-form__row">
                <div class="admin-form__field">
                  <label>Nom du salon *</label>
                  <input type="text" [(ngModel)]="formName" name="name" required placeholder="Ex: Dakar Barber Lounge" />
                </div>
                <div class="admin-form__field">
                  <label>Quartier / Zone *</label>
                  <input type="text" [(ngModel)]="formDistrict" name="district" required placeholder="Ex: Mermoz, Almadies, Plateau..." />
                </div>
              </div>

              <app-admin-image-uploader
                label="Photo de couverture / Bannière du salon"
                [(imageUrl)]="formCoverUrl"
              />

              <!-- GPS True Location Picker Card -->
              <div class="gps-picker-card">
                <div class="gps-picker-header">
                  <h4>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E5AF0" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                    Position Géographique Réelle (GPS)
                  </h4>
                  <span>Indispensable pour le guidage des clients</span>
                </div>

                <div class="gps-actions-grid">
                  <button
                    type="button"
                    class="gps-btn gps-btn--detect"
                    (click)="detectGpsPosition()"
                    [disabled]="isGpsLoading()"
                  >
                    @if (isGpsLoading()) {
                      <span>Recherche satellite</span><span class="loading-dots" aria-hidden="true"></span>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                      <span>Détecter ma position GPS</span>
                    }
                  </button>

                  <label class="gps-btn gps-btn--upload" style="cursor: pointer;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Importer fichier position</span>
                    <input
                      type="file"
                      accept=".json,.gpx,.kml,.txt"
                      style="display: none;"
                      (change)="onLocationFileSelected($event)"
                    />
                  </label>
                </div>

                <!-- Input or Paste Link / Coordinates -->
                <div class="admin-form__field" style="margin-top: 4px;">
                  <label style="font-size: 0.75rem; color: #64748b;">Ou collez un lien Google Maps / Position WhatsApp ou coordonnées (ex: 14.7167, -17.4677)</label>
                  <input
                    type="text"
                    [(ngModel)]="pastedLocationInput"
                    name="pastedLocation"
                    (ngModelChange)="onPasteLocationChange($event)"
                    placeholder="https://maps.app.goo.gl/... ou 14.716677, -17.467686"
                    style="font-size: 0.8125rem;"
                  />
                </div>

                <!-- Verified GPS Badge -->
                @if (formLatitude && formLongitude) {
                  <div class="gps-coords-badge">
                    <span class="coords-text">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      GPS Verrouillé : {{ formLatitude.toFixed(6) }}, {{ formLongitude.toFixed(6) }}
                    </span>
                    <a
                      [href]="'https://www.google.com/maps?q=' + formLatitude + ',' + formLongitude"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="maps-link"
                    >
                      Voir sur Google Maps ↗
                    </a>
                  </div>
                }

                @if (gpsSuccessMessage()) {
                  <div style="font-size: 0.75rem; color: #059669; font-weight: 600;">
                    {{ gpsSuccessMessage() }}
                  </div>
                }
              </div>

              <div class="admin-form__row">
                <div class="admin-form__field">
                  <label>Adresse descriptive / Repère</label>
                  <input type="text" [(ngModel)]="formLocation" name="location" placeholder="Ex: Route de Ouakam, en face Brioche Dorée" />
                </div>
                <div class="admin-form__field">
                  <label>Téléphone du salon</label>
                  <input type="tel" [(ngModel)]="formPhone" name="phone" placeholder="+221 33 800 00 00" />
                </div>
              </div>

              <div class="admin-form__field">
                <label>Statut d'ouverture</label>
                <select [(ngModel)]="formStatus" name="status">
                  <option value="open">🟢 Ouvert aux clients</option>
                  <option value="closed">🔴 Fermé temporairement</option>
                </select>
              </div>
            </div>
          }

        </form>

        <!-- Multi-Step Footer Navigation -->
        <div footer-actions style="width: 100%;">
          <div class="modal-footer-nav">
            @if (currentStep() === 2) {
              <button type="button" class="admin-btn admin-btn--outline" (click)="prevStep()">
                ← Précédent
              </button>
            } @else {
              <button type="button" class="admin-btn admin-btn--outline" (click)="isModalOpen.set(false)">
                Annuler
              </button>
            }

            @if (currentStep() === 1) {
              <button type="button" class="admin-btn admin-btn--primary" (click)="nextStep()">
                Suivant : Salon &amp; Position →
              </button>
            } @else {
              <button type="button" class="admin-btn admin-btn--primary" (click)="saveSalon()">
                @if (editingSalonId()) {
                  Enregistrer les modifications
                } @else {
                  Créer le Salon
                }
              </button>
            }
          </div>
        </div>
      </app-admin-modal>

    </div>
  `,
  styleUrl: './admin-salons-page.scss'
})
export class AdminSalonsPage {
  protected readonly data = inject(AdminDataService);
  private readonly confirmService = inject(AdminConfirmService);

  protected searchQuery = '';
  protected statusFilter = 'all';
  protected viewMode: AdminViewMode = 'table';

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly isModalOpen = signal<boolean>(false);
  protected readonly editingSalonId = signal<string | null>(null);
  protected readonly currentStep = signal<number>(1);

  // ── Step 1 : Coiffeur Propriétaire ────────────────────────
  protected formOwnerFirstName = '';
  protected formOwnerLastName = '';
  protected formOwnerPhone = '';
  protected formOwnerAvatarUrl = '';

  // ── Step 2 : Salon & Localisation GPS ─────────────────────
  protected formName = '';
  protected formDistrict = '';
  protected formLocation = '';
  protected formPhone = '';
  protected formCoverUrl = '';
  protected formStatus: 'open' | 'closed' = 'open';

  protected formLatitude: number | null = 14.716677;
  protected formLongitude: number | null = -17.467686;
  protected readonly isGpsLoading = signal<boolean>(false);
  protected readonly gpsSuccessMessage = signal<string>('');
  protected pastedLocationInput = '';

  protected getOwnerFullName(): string {
    const full = `${this.formOwnerFirstName} ${this.formOwnerLastName}`.trim();
    return full || 'Coiffeur Propriétaire';
  }

  protected readonly filteredSalons = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const st = this.statusFilter;

    return this.data.salons().filter(salon => {
      const matchQuery =
        !q ||
        salon.name.toLowerCase().includes(q) ||
        (salon.district && salon.district.toLowerCase().includes(q)) ||
        (salon.location && salon.location.toLowerCase().includes(q)) ||
        (salon.ownerName && salon.ownerName.toLowerCase().includes(q));

      const matchStatus = st === 'all' || salon.status === st;

      return matchQuery && matchStatus;
    });
  });

  protected readonly paginatedSalons = computed(() => {
    const list = this.filteredSalons();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  protected nextStep(): void {
    if (this.currentStep() === 1) {
      if (!this.formOwnerFirstName.trim() && !this.formOwnerLastName.trim()) {
        this.formOwnerFirstName = 'Abdoulaye';
        this.formOwnerLastName = 'Diouf';
      }
      this.currentStep.set(2);
    }
  }

  protected prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  protected detectGpsPosition(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.gpsSuccessMessage.set('La géolocalisation n\'est pas supportée par ce navigateur.');
      return;
    }

    this.isGpsLoading.set(true);
    this.gpsSuccessMessage.set('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isGpsLoading.set(false);
        this.formLatitude = position.coords.latitude;
        this.formLongitude = position.coords.longitude;
        this.gpsSuccessMessage.set(`✅ Position GPS capturée avec succès (${this.formLatitude.toFixed(6)}, ${this.formLongitude.toFixed(6)})`);
        if (!this.formLocation) {
          this.formLocation = `Dakar, Sénégal (${this.formLatitude.toFixed(4)}, ${this.formLongitude.toFixed(4)})`;
        }
      },
      (error) => {
        this.isGpsLoading.set(false);
        console.warn('[GPS] Geolocation error:', error);
        this.formLatitude = 14.716677;
        this.formLongitude = -17.467686;
        this.gpsSuccessMessage.set('Coordonnées Dakar (Mermoz) appliquées par défaut.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  protected onPasteLocationChange(value: string): void {
    if (!value) return;
    const clean = value.trim();

    // Regex for coordinates: 14.7167, -17.4677 or 14.7167,-17.4677
    const coordsMatch = clean.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordsMatch) {
      this.formLatitude = parseFloat(coordsMatch[1]);
      this.formLongitude = parseFloat(coordsMatch[2]);
      this.gpsSuccessMessage.set(`✅ Coordonnées extraites : ${this.formLatitude}, ${this.formLongitude}`);
      return;
    }

    // Regex for Google Maps URL with q= or @
    const mapsMatch = clean.match(/(?:q=|@)(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (mapsMatch) {
      this.formLatitude = parseFloat(mapsMatch[1]);
      this.formLongitude = parseFloat(mapsMatch[2]);
      this.gpsSuccessMessage.set(`✅ Position Maps extraite : ${this.formLatitude}, ${this.formLongitude}`);
    }
  }

  protected onLocationFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = reader.result as string;
        
        // 1. Try JSON
        try {
          const json = JSON.parse(text);
          const lat = json.latitude || json.lat || json.coords?.latitude;
          const lng = json.longitude || json.lng || json.coords?.longitude;
          if (lat && lng) {
            this.formLatitude = parseFloat(lat);
            this.formLongitude = parseFloat(lng);
            this.gpsSuccessMessage.set(`✅ Fichier JSON lu : ${this.formLatitude}, ${this.formLongitude}`);
            return;
          }
        } catch {
          // not JSON, fallback to text parsing
        }

        // 2. Try GPX / KML / XML or raw text coordinates
        const match = text.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/) ||
                      text.match(/lat="(-?\d+\.\d+)"\s+lon="(-?\d+\.\d+)"/) ||
                      text.match(/<coordinates>(-?\d+\.\d+),(-?\d+\.\d+)/);

        if (match) {
          this.formLatitude = parseFloat(match[1]);
          this.formLongitude = parseFloat(match[2]);
          this.gpsSuccessMessage.set(`✅ Position extraite du fichier : ${this.formLatitude}, ${this.formLongitude}`);
        } else {
          this.gpsSuccessMessage.set('Aucune coordonnée GPS détectée dans ce fichier.');
        }
      } catch (err) {
        console.warn('[LocationFile] Error parsing location file:', err);
        this.gpsSuccessMessage.set('Erreur lors de la lecture du fichier.');
      }
    };

    reader.readAsText(file);
  }

  protected openAddModal(): void {
    this.editingSalonId.set(null);
    this.currentStep.set(1);
    this.formOwnerFirstName = '';
    this.formOwnerLastName = '';
    this.formOwnerPhone = '+221 77 123 45 67';
    this.formOwnerAvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    this.formName = '';
    this.formDistrict = 'Mermoz';
    this.formLocation = 'Route de Ouakam, Dakar, Sénégal';
    this.formPhone = '+221 77 123 45 67';
    this.formCoverUrl = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80';
    this.formStatus = 'open';
    this.formLatitude = 14.716677;
    this.formLongitude = -17.467686;
    this.gpsSuccessMessage.set('');
    this.pastedLocationInput = '';
    this.isModalOpen.set(true);
  }

  protected openEditModal(salon: Salon): void {
    this.editingSalonId.set(salon.id);
    this.currentStep.set(1);

    const parts = (salon.ownerName || salon.coiffeurName || '').split(' ');
    this.formOwnerFirstName = parts[0] || '';
    this.formOwnerLastName = parts.slice(1).join(' ') || '';
    this.formOwnerPhone = salon.phone || '';
    this.formOwnerAvatarUrl = salon.avatarUrl || '';

    this.formName = salon.name;
    this.formDistrict = salon.district || '';
    this.formLocation = salon.location || '';
    this.formPhone = salon.phone || '';
    this.formCoverUrl = salon.coverUrl || salon.avatarUrl || '';
    this.formStatus = salon.status;
    this.formLatitude = salon.latitude || 14.716677;
    this.formLongitude = salon.longitude || -17.467686;
    this.gpsSuccessMessage.set('');
    this.pastedLocationInput = `${this.formLatitude}, ${this.formLongitude}`;
    this.isModalOpen.set(true);
  }

  protected saveSalon(): void {
    if (!this.formName.trim()) {
      this.currentStep.set(2);
      return;
    }

    const ownerFullName = this.getOwnerFullName();

    if (this.editingSalonId()) {
      this.data.updateSalon(this.editingSalonId()!, {
        name: this.formName,
        district: this.formDistrict,
        location: this.formLocation,
        phone: this.formPhone,
        ownerName: ownerFullName,
        coverUrl: this.formCoverUrl,
        avatarUrl: this.formOwnerAvatarUrl || this.formCoverUrl,
        latitude: this.formLatitude || 14.716677,
        longitude: this.formLongitude || -17.467686,
        status: this.formStatus
      });
    } else {
      const slug = this.formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newSalon: Salon = {
        id: slug || 'salon-' + Date.now(),
        name: this.formName,
        district: this.formDistrict,
        location: this.formLocation,
        phone: this.formPhone || this.formOwnerPhone,
        ownerName: ownerFullName,
        coverUrl: this.formCoverUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
        avatarUrl: this.formOwnerAvatarUrl || this.formCoverUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
        latitude: this.formLatitude || 14.716677,
        longitude: this.formLongitude || -17.467686,
        status: this.formStatus,
        peopleWaiting: 0,
        actions: [
          { label: 'Appeler', icon: 'phone', href: 'tel:' + (this.formPhone || this.formOwnerPhone || '') },
          { label: 'Itinéraire', icon: 'navigation', href: `https://www.google.com/maps?q=${this.formLatitude || 14.716677},${this.formLongitude || -17.467686}` },
          { label: 'Partager', icon: 'share', href: '#' }
        ]
      };
      this.data.addSalon(newSalon, {
        firstName: this.formOwnerFirstName,
        lastName: this.formOwnerLastName,
        phone: this.formOwnerPhone || this.formPhone,
        avatarUrl: this.formOwnerAvatarUrl
      }).subscribe((success) => {
        if (success) {
          this.isModalOpen.set(false);
        } else {
          alert("Erreur : impossible d'enregistrer le salon sur le serveur. Veuillez vérifier les informations saisies.");
        }
      });
      return;
    }

    this.isModalOpen.set(false);
  }

  protected async deleteSalon(salon: Salon): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Suppression de Salon',
      message: `Êtes-vous sûr de vouloir supprimer définitivement le salon "${salon.name}" ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer le salon',
      variant: 'danger'
    });
    if (confirmed) {
      this.data.deleteSalon(salon.id);
    }
  }
}
