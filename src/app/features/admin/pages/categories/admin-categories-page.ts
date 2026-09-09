import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService, AdminCategoryItem } from '../../services/admin-data.service';
import { AdminModal } from '../../components/admin-modal/admin-modal';
import { AdminImageUploader } from '../../components/admin-image-uploader/admin-image-uploader';
import { AdminPagination } from '../../components/admin-pagination/admin-pagination';
import { AdminViewToggle, AdminViewMode } from '../../components/admin-view-toggle/admin-view-toggle';
import { AdminConfirmService } from '../../services/admin-confirm.service';

@Component({
  selector: 'app-admin-categories-page',
  imports: [FormsModule, AdminModal, AdminImageUploader, AdminPagination, AdminViewToggle],
  template: `
    <div class="admin-page">
      
      <!-- Page Header -->
      <div class="admin-page__header">
        <div>
          <h1>Gestion des Catégories &bull; Boutique</h1>
          <p>Organisez les rayons et classifications de produits vendus sur la boutique Fotolou.</p>
        </div>
        <button type="button" class="admin-btn admin-btn--primary" (click)="openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Nouvelle Catégorie</span>
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
            placeholder="Rechercher une catégorie..."
          />
        </div>

        <app-admin-view-toggle [(viewMode)]="viewMode" />
      </div>

      <!-- Grid View Mode -->
      @if (viewMode === 'grid') {
        <div class="admin-categories-grid">
          @for (cat of paginatedCategories(); track cat.id) {
            <div class="admin-category-card">
              <div class="admin-category-card__img-wrap">
                <img [src]="cat.image" [alt]="cat.name" />
                <div class="admin-category-card__icon-bubble">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: var(--primary, #1E5AF0);">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                </div>
              </div>

              <div class="admin-category-card__body">
                <div class="admin-category-card__title-row">
                  <h3>{{ cat.name }}</h3>
                  <span class="admin-category-card__count-badge">
                    {{ data.getProductsCountByCategory(cat.id) }} produit(s)
                  </span>
                </div>

                <p class="admin-category-card__desc">{{ cat.description }}</p>
                <span class="admin-category-card__slug">Identifiant : <code>{{ cat.id }}</code></span>
              </div>

              <div class="admin-category-card__footer">
                <button type="button" class="admin-btn-secondary" (click)="openEditModal(cat)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  <span>Modifier</span>
                </button>

                <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="deleteCategory(cat)" title="Supprimer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          } @empty {
            <div class="admin-table__empty" style="grid-column: 1 / -1; background: #ffffff; border-radius: 16px; padding: 40px; text-align: center;">
              Aucune catégorie trouvée.
            </div>
          }
        </div>

        <div class="admin-card" style="margin-top: 16px;">
          <app-admin-pagination
            [totalItems]="filteredCategories().length"
            [pageSize]="pageSize()"
            [currentPage]="currentPage()"
            (pageChange)="currentPage.set($event)"
            (pageSizeChange)="pageSize.set($event)"
          />
        </div>
      }

      <!-- Table View Mode -->
      @if (viewMode === 'table') {
        <div class="admin-card">
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Identifiant (Slug)</th>
                  <th>Description</th>
                  <th>Produits associés</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of paginatedCategories(); track cat.id) {
                  <tr>
                    <td>
                      <div class="admin-table__item-with-img">
                        <img [src]="cat.image" [alt]="cat.name" class="admin-table__thumb" />
                        <strong>{{ cat.name }}</strong>
                      </div>
                    </td>
                    <td><code>{{ cat.id }}</code></td>
                    <td>{{ cat.description }}</td>
                    <td>
                      <span class="admin-category-card__count-badge">
                        {{ data.getProductsCountByCategory(cat.id) }} produit(s)
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div class="admin-table__actions">
                        <button type="button" class="admin-icon-btn" (click)="openEditModal(cat)" title="Modifier">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="deleteCategory(cat)" title="Supprimer">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="admin-table__empty">
                      Aucune catégorie trouvée.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <app-admin-pagination
            [totalItems]="filteredCategories().length"
            [pageSize]="pageSize()"
            [currentPage]="currentPage()"
            (pageChange)="currentPage.set($event)"
            (pageSizeChange)="pageSize.set($event)"
          />
        </div>
      }

      <!-- Add / Edit Category Modal -->
      <app-admin-modal
        [title]="editingId() ? 'Modifier la Catégorie' : 'Ajouter une Nouvelle Catégorie'"
        [isOpen]="isModalOpen()"
        (close)="closeModal()"
      >
        <form class="admin-form" (ngSubmit)="saveCategory()">
          @if (formError()) {
            <div class="admin-form-alert admin-form-alert--danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ formError() }}</span>
            </div>
          }

          <div class="admin-form__field">
            <label>Nom de la catégorie *</label>
            <input
              type="text"
              [(ngModel)]="formName"
              name="name"
              required
              maxlength="100"
              placeholder="Ex: Soins de la Barbe"
              (input)="formError.set(null)"
            />
          </div>

          <div class="admin-form__field">
            <label>Description courte</label>
            <textarea
              [(ngModel)]="formDescription"
              name="description"
              rows="3"
              maxlength="500"
              placeholder="Ex: Tous les produits indispensables pour entretenir votre barbe au quotidien..."
              style="width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px; font-family: inherit; font-size: 0.875rem;"
            ></textarea>
          </div>

          <app-admin-image-uploader
            label="Image de couverture de la catégorie"
            [(imageUrl)]="formImage"
          />
        </form>

        <div footer-actions>
          <button
            type="button"
            class="admin-btn admin-btn--primary"
            [disabled]="isSubmitting()"
            (click)="saveCategory()"
          >
            @if (isSubmitting()) {
              <span>Enregistrement en cours</span><span class="loading-dots" aria-hidden="true"></span>
            } @else {
              <span>{{ editingId() ? 'Enregistrer les modifications' : 'Créer la catégorie' }}</span>
            }
          </button>
        </div>
      </app-admin-modal>

      <!-- Toast Feedback -->
      @if (successToast()) {
        <div class="admin-toast-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>{{ successToast() }}</span>
        </div>
      }

    </div>
  `,
  styleUrl: './admin-categories-page.scss'
})
export class AdminCategoriesPage {
  protected readonly data = inject(AdminDataService);
  private readonly confirmService = inject(AdminConfirmService);

  protected searchQuery = '';
  protected viewMode: AdminViewMode = 'grid';

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly isModalOpen = signal<boolean>(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly successToast = signal<string | null>(null);

  protected formName = '';
  protected formIcon = 'category';
  protected formDescription = '';
  protected formImage = '';

  protected readonly filteredCategories = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();

    return this.data.categories().filter(c => {
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
  });

  protected readonly paginatedCategories = computed(() => {
    const list = this.filteredCategories();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  protected openAddModal(): void {
    this.editingId.set(null);
    this.formName = '';
    this.formIcon = 'category';
    this.formDescription = '';
    this.formImage = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80';
    this.formError.set(null);
    this.isSubmitting.set(false);
    this.isModalOpen.set(true);
  }

  protected openEditModal(cat: AdminCategoryItem): void {
    this.editingId.set(cat.id);
    this.formName = cat.name;
    this.formIcon = cat.icon;
    this.formDescription = cat.description;
    this.formImage = cat.image;
    this.formError.set(null);
    this.isSubmitting.set(false);
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    if (!this.isSubmitting()) {
      this.isModalOpen.set(false);
      this.formError.set(null);
    }
  }

  protected saveCategory(): void {
    const trimmedName = this.formName.trim();
    if (!trimmedName) {
      this.formError.set('Veuillez saisir un nom pour la catégorie.');
      return;
    }

    this.formError.set(null);
    this.isSubmitting.set(true);

    if (this.editingId()) {
      this.data.updateCategory(this.editingId()!, {
        name: trimmedName,
        icon: this.formIcon || 'category',
        description: this.formDescription.trim(),
        image: this.formImage
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isModalOpen.set(false);
          this.showSuccess('Catégorie mise à jour avec succès !');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(this.extractError(err, 'Impossible de modifier la catégorie. Vérifiez les informations saisies.'));
        }
      });
    } else {
      const newCat: AdminCategoryItem = {
        id: '',
        name: trimmedName,
        icon: this.formIcon || 'category',
        description: this.formDescription.trim(),
        image: this.formImage || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80'
      };

      this.data.addCategory(newCat).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isModalOpen.set(false);
          this.showSuccess('Catégorie créée avec succès !');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(this.extractError(err, 'Impossible de créer la catégorie. Un doublon de nom existe peut-être déjà.'));
        }
      });
    }
  }

  protected async deleteCategory(cat: AdminCategoryItem): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Suppression de Catégorie',
      message: `Êtes-vous sûr de vouloir supprimer la catégorie "${cat.name}" ? Les produits associés devront être réassignés.`,
      confirmLabel: 'Supprimer la catégorie',
      variant: 'danger'
    });
    if (confirmed) {
      this.data.deleteCategory(cat.id).subscribe({
        next: () => {
          this.showSuccess(`La catégorie "${cat.name}" a été supprimée.`);
        },
        error: (err) => {
          alert(this.extractError(err, 'Échec de la suppression de la catégorie.'));
        }
      });
    }
  }

  private showSuccess(msg: string): void {
    this.successToast.set(msg);
    setTimeout(() => {
      this.successToast.set(null);
    }, 3500);
  }

  private extractError(err: any, fallback: string): string {
    if (err?.status === 0) {
      return 'Impossible de contacter le serveur. Vérifiez que le backend est bien démarré.';
    }
    if (err?.status === 409 || (err?.error?.message && err?.error?.message.includes('unique'))) {
      return 'Une catégorie avec ce nom ou cet identifiant existe déjà.';
    }
    if (err?.error?.detail) {
      return err.error.detail;
    }
    if (err?.error?.message) {
      return err.error.message;
    }
    if (err?.message && !err?.message.includes('Http failure')) {
      return err.message;
    }
    return fallback;
  }
}
