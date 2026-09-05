import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService, AdminCoiffeur } from '../../services/admin-data.service';
import { AdminBadge } from '../../components/admin-badge/admin-badge';
import { AdminModal } from '../../components/admin-modal/admin-modal';
import { AdminImageUploader } from '../../components/admin-image-uploader/admin-image-uploader';
import { AdminPagination } from '../../components/admin-pagination/admin-pagination';
import { AdminViewToggle, AdminViewMode } from '../../components/admin-view-toggle/admin-view-toggle';
import { AdminConfirmService } from '../../services/admin-confirm.service';

@Component({
  selector: 'app-admin-coiffeurs-page',
  imports: [FormsModule, AdminBadge, AdminModal, AdminImageUploader, AdminPagination, AdminViewToggle],
  template: `
    <div class="admin-page">
      
      <!-- Page Header -->
      <div class="admin-page__header">
        <div>
          <h1>Équipes &amp; Coiffeurs</h1>
          <p>Gérez les professionnels de la coiffure affiliés à chaque salon partenaire.</p>
        </div>
        <button type="button" class="admin-btn admin-btn--primary" (click)="openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Nouveau Coiffeur</span>
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
            placeholder="Rechercher par nom, salon ou spécialité..."
          />
        </div>

        <div class="admin-toolbar__right">
          <div class="admin-filter-group">
            <select [(ngModel)]="salonFilter" (ngModelChange)="currentPage.set(1)">
              <option value="all">Tous les salons</option>
              @for (salon of data.salons(); track salon.id) {
                <option [value]="salon.id">{{ salon.name }}</option>
              }
            </select>
          </div>

          <app-admin-view-toggle [(viewMode)]="viewMode" />
        </div>
      </div>

      <!-- Table View Mode -->
      @if (viewMode === 'table') {
        <div class="admin-card">
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Coiffeur</th>
                  <th>Salon rattaché</th>
                  <th>Téléphone</th>
                  <th>Spécialité</th>
                  <th>Clients servis</th>
                  <th>Statut</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (c of paginatedCoiffeurs(); track c.id) {
                  <tr>
                    <td>
                      <div class="admin-table__item-with-img">
                        <img [src]="c.avatarUrl" [alt]="c.name" class="admin-table__thumb" />
                        <strong>{{ c.name }}</strong>
                      </div>
                    </td>
                    <td>
                      <span class="admin-table__salon-pill">{{ c.salonName }}</span>
                    </td>
                    <td>{{ c.phone }}</td>
                    <td>{{ c.specialty }}</td>
                    <td>
                      <strong>{{ c.ticketsServedCount }}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="admin-status-toggle"
                        (click)="data.toggleCoiffeurActive(c.id)"
                        [title]="c.active ? 'Désactiver' : 'Activer'"
                      >
                        <app-admin-badge [variant]="c.active ? 'success' : 'neutral'">
                          {{ c.active ? 'Actif' : 'Inactif' }}
                        </app-admin-badge>
                      </button>
                    </td>
                    <td style="text-align: right;">
                      <div class="admin-table__actions">
                        <button type="button" class="admin-icon-btn" (click)="openEditModal(c)" title="Modifier">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="deleteCoiffeur(c)" title="Supprimer">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="admin-table__empty">
                      Aucun coiffeur trouvé.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <app-admin-pagination
            [totalItems]="filteredCoiffeurs().length"
            [pageSize]="pageSize()"
            [currentPage]="currentPage()"
            (pageChange)="currentPage.set($event)"
            (pageSizeChange)="pageSize.set($event)"
          />
        </div>
      }

      <!-- Grid View Mode -->
      @if (viewMode === 'grid') {
        <div class="admin-grid-cards">
          @for (c of paginatedCoiffeurs(); track c.id) {
            <div class="admin-coiffeur-card">
              <div class="admin-coiffeur-card__top">
                <img [src]="c.avatarUrl" [alt]="c.name" class="admin-coiffeur-card__avatar" />
                <div class="admin-coiffeur-card__info">
                  <h3>{{ c.name }}</h3>
                  <span class="admin-table__salon-pill">{{ c.salonName }}</span>
                </div>
                <button
                  type="button"
                  class="admin-status-toggle"
                  (click)="data.toggleCoiffeurActive(c.id)"
                >
                  <app-admin-badge [variant]="c.active ? 'success' : 'neutral'">
                    {{ c.active ? 'Actif' : 'Inactif' }}
                  </app-admin-badge>
                </button>
              </div>

              <div class="admin-coiffeur-card__body">
                <div class="admin-coiffeur-card__field">
                  <span class="label">Spécialité</span>
                  <span class="value">{{ c.specialty }}</span>
                </div>
                <div class="admin-coiffeur-card__field">
                  <span class="label">Téléphone</span>
                  <span class="value">{{ c.phone }}</span>
                </div>
                <div class="admin-coiffeur-card__field">
                  <span class="label">Clients servis</span>
                  <span class="value"><strong>{{ c.ticketsServedCount }}</strong></span>
                </div>
              </div>

              <div class="admin-coiffeur-card__footer">
                <button type="button" class="admin-btn-secondary" (click)="openEditModal(c)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  <span>Modifier</span>
                </button>
                <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="deleteCoiffeur(c)" title="Supprimer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          } @empty {
            <div class="admin-table__empty" style="grid-column: 1 / -1; background: #ffffff; border-radius: 16px; padding: 40px; text-align: center;">
              Aucun coiffeur trouvé.
            </div>
          }
        </div>

        <div class="admin-card" style="margin-top: 16px;">
          <app-admin-pagination
            [totalItems]="filteredCoiffeurs().length"
            [pageSize]="pageSize()"
            [currentPage]="currentPage()"
            (pageChange)="currentPage.set($event)"
            (pageSizeChange)="pageSize.set($event)"
          />
        </div>
      }

      <!-- Add / Edit Coiffeur Modal -->
      <app-admin-modal
        [title]="editingId() ? 'Modifier le Coiffeur' : 'Ajouter un Nouveau Coiffeur'"
        [isOpen]="isModalOpen()"
        (close)="isModalOpen.set(false)"
      >
        <form class="admin-form" (ngSubmit)="saveCoiffeur()">
          <div class="admin-form__row">
            <div class="admin-form__field">
              <label>Nom complet *</label>
              <input type="text" [(ngModel)]="formName" name="name" required placeholder="Ex: Moussa Ndiaye" />
            </div>
            <div class="admin-form__field">
              <label>Téléphone *</label>
              <input type="text" [(ngModel)]="formPhone" name="phone" required placeholder="+221 77 123 45 67" />
            </div>
          </div>

          <div class="admin-form__row">
            <div class="admin-form__field">
              <label>Salon affilié *</label>
              <select [(ngModel)]="formSalonId" name="salonId">
                @for (salon of data.salons(); track salon.id) {
                  <option [value]="salon.id">{{ salon.name }} ({{ salon.district }})</option>
                }
              </select>
            </div>
            <div class="admin-form__field">
              <label>Spécialité</label>
              <input type="text" [(ngModel)]="formSpecialty" name="specialty" placeholder="Ex: Dégradé, Barbe..." />
            </div>
          </div>

          <app-admin-image-uploader
            label="Avatar / Photo de profil du coiffeur"
            [(imageUrl)]="formAvatarUrl"
          />
        </form>

        <div footer-actions>
          <button type="button" class="admin-btn admin-btn--primary" (click)="saveCoiffeur()">
            {{ editingId() ? 'Enregistrer les modifications' : 'Ajouter le coiffeur' }}
          </button>
        </div>
      </app-admin-modal>

    </div>
  `,
  styleUrl: './admin-coiffeurs-page.scss'
})
export class AdminCoiffeursPage {
  protected readonly data = inject(AdminDataService);
  private readonly confirmService = inject(AdminConfirmService);

  protected searchQuery = '';
  protected salonFilter = 'all';
  protected viewMode: AdminViewMode = 'table';

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(6);

  protected readonly isModalOpen = signal<boolean>(false);
  protected readonly editingId = signal<string | null>(null);

  protected formName = '';
  protected formPhone = '';
  protected formSalonId = 'king-barber';
  protected formSpecialty = '';
  protected formAvatarUrl = '';

  protected readonly filteredCoiffeurs = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const salon = this.salonFilter;

    return this.data.coiffeurs().filter(c => {
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.salonName.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q) ||
        c.phone.includes(q);

      const matchSalon = salon === 'all' || c.salonId === salon;

      return matchQuery && matchSalon;
    });
  });

  protected readonly paginatedCoiffeurs = computed(() => {
    const list = this.filteredCoiffeurs();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  protected openAddModal(): void {
    this.editingId.set(null);
    this.formName = '';
    this.formPhone = '+221 77 ';
    this.formSalonId = this.data.salons()[0]?.id || 'king-barber';
    this.formSpecialty = 'Dégradé, Barbe';
    this.formAvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    this.isModalOpen.set(true);
  }

  protected openEditModal(c: AdminCoiffeur): void {
    this.editingId.set(c.id);
    this.formName = c.name;
    this.formPhone = c.phone;
    this.formSalonId = c.salonId;
    this.formSpecialty = c.specialty;
    this.formAvatarUrl = c.avatarUrl;
    this.isModalOpen.set(true);
  }

  protected saveCoiffeur(): void {
    if (!this.formName.trim()) return;

    const salon = this.data.salons().find(s => s.id === this.formSalonId);
    const salonName = salon ? salon.name : 'Salon Fotolou';

    if (this.editingId()) {
      this.data.updateCoiffeur(this.editingId()!, {
        name: this.formName,
        phone: this.formPhone,
        salonId: this.formSalonId,
        salonName,
        specialty: this.formSpecialty,
        avatarUrl: this.formAvatarUrl
      });
    } else {
      const newCoiffeur: AdminCoiffeur = {
        id: 'c-' + Date.now(),
        name: this.formName,
        phone: this.formPhone,
        salonId: this.formSalonId,
        salonName,
        specialty: this.formSpecialty,
        active: true,
        avatarUrl: this.formAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        ticketsServedCount: 0
      };
      this.data.addCoiffeur(newCoiffeur);
    }

    this.isModalOpen.set(false);
  }

  protected async deleteCoiffeur(c: AdminCoiffeur): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Suppression de Coiffeur',
      message: `Êtes-vous sûr de vouloir retirer le coiffeur "${c.name}" (${c.salonName}) de la plateforme ?`,
      confirmLabel: 'Supprimer le coiffeur',
      variant: 'danger'
    });
    if (confirmed) {
      this.data.deleteCoiffeur(c.id);
    }
  }
}
