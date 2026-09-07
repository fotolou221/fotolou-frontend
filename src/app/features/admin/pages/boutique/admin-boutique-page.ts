import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { AdminBadge } from '../../components/admin-badge/admin-badge';
import { AdminModal } from '../../components/admin-modal/admin-modal';
import { AdminImageUploader } from '../../components/admin-image-uploader/admin-image-uploader';
import { AdminPagination } from '../../components/admin-pagination/admin-pagination';
import { AdminViewToggle, AdminViewMode } from '../../components/admin-view-toggle/admin-view-toggle';
import { Product } from '../../../../shared/models/product';
import { AdminConfirmService } from '../../services/admin-confirm.service';

@Component({
  selector: 'app-admin-boutique-page',
  imports: [FormsModule, AdminBadge, AdminModal, AdminImageUploader, AdminPagination, AdminViewToggle],
  template: `
    <div class="admin-page">
      
      <!-- Page Header -->
      <div class="admin-page__header">
        <div>
          <h1>Boutique &amp; Produits E-Commerce</h1>
          <p>Gérez les produits capillaires, accessoires et tondeuses en vente sur l'application.</p>
        </div>
        <button type="button" class="admin-btn admin-btn--primary" (click)="openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Nouveau Produit</span>
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
            placeholder="Rechercher par titre, marque ou catégorie..."
          />
        </div>

        <div class="admin-toolbar__right">
          <div class="admin-filter-group">
            <select [(ngModel)]="categoryFilter" (ngModelChange)="currentPage.set(1)">
              <option value="all">Toutes les catégories</option>
              @for (cat of data.categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
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
                  <th>Produit</th>
                  <th>Marque</th>
                  <th>Catégorie</th>
                  <th>Prix (FCFA)</th>
                  <th>Note</th>
                  <th>Stock</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (product of paginatedProducts(); track product.id) {
                  <tr>
                    <td>
                      <div class="admin-table__item-with-img">
                        <img [src]="product.images[0]" [alt]="product.title" class="admin-table__thumb" />
                        <div>
                          <strong>{{ product.title }}</strong>
                          <span class="admin-table__subtext">{{ product.description }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong class="admin-brand-tag">{{ product.brand }}</strong>
                    </td>
                    <td>
                      <span class="admin-category-badge">{{ data.getCategoryName(product.categoryId) }}</span>
                    </td>
                    <td>
                      <strong class="admin-price-tag">{{ formatPrice(product.price) }}</strong>
                    </td>
                    <td>
                      <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #475569;">
                        <svg viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" style="width: 14px; height: 14px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        {{ product.rating }}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="admin-status-toggle"
                        (click)="data.toggleProductStock(product.id)"
                        [title]="product.inStock ? 'Marquer Rupture' : 'Marquer En Stock'"
                      >
                        <app-admin-badge [variant]="product.inStock ? 'success' : 'danger'">
                          {{ product.inStock ? 'En stock' : 'Rupture' }}
                        </app-admin-badge>
                      </button>
                    </td>
                    <td style="text-align: right;">
                      <div class="admin-table__actions">
                        <button type="button" class="admin-icon-btn" (click)="openEditModal(product)" title="Modifier">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="deleteProduct(product)" title="Supprimer">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="admin-table__empty">
                      Aucun produit trouvé.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <app-admin-pagination
            [totalItems]="filteredProducts().length"
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
          @for (product of paginatedProducts(); track product.id) {
            <div class="admin-product-card">
              <div class="admin-product-card__img-wrap">
                <img [src]="product.images[0]" [alt]="product.title" />
                <div class="admin-product-card__stock-tag">
                  <app-admin-badge [variant]="product.inStock ? 'success' : 'danger'">
                    {{ product.inStock ? 'En stock' : 'Rupture' }}
                  </app-admin-badge>
                </div>
              </div>

              <div class="admin-product-card__body">
                <div class="admin-product-card__brand-row">
                  <span class="admin-brand-tag">{{ product.brand }}</span>
                  <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.8125rem; font-weight: 700; color: #475569;">
                    <svg viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" style="width: 14px; height: 14px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {{ product.rating }}
                  </span>
                </div>

                <h3>{{ product.title }}</h3>
                <p class="admin-product-card__desc">{{ product.description }}</p>

                <div class="admin-product-card__price-row">
                  <strong class="admin-price-tag">{{ formatPrice(product.price) }}</strong>
                  <span class="admin-product-card__cat">{{ data.getCategoryName(product.categoryId) }}</span>
                </div>
              </div>

              <div class="admin-product-card__footer">
                <button
                  type="button"
                  class="admin-status-toggle"
                  (click)="data.toggleProductStock(product.id)"
                >
                  <app-admin-badge [variant]="product.inStock ? 'success' : 'danger'">
                    {{ product.inStock ? 'Marquer Rupture' : 'Marquer En Stock' }}
                  </app-admin-badge>
                </button>

                <div class="admin-product-card__actions">
                  <button type="button" class="admin-icon-btn" (click)="openEditModal(product)" title="Modifier">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                  <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="deleteProduct(product)" title="Supprimer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="admin-table__empty" style="grid-column: 1 / -1; background: #ffffff; border-radius: 16px; padding: 40px; text-align: center;">
              Aucun produit trouvé.
            </div>
          }
        </div>

        <div class="admin-card" style="margin-top: 16px;">
          <app-admin-pagination
            [totalItems]="filteredProducts().length"
            [pageSize]="pageSize()"
            [currentPage]="currentPage()"
            (pageChange)="currentPage.set($event)"
            (pageSizeChange)="pageSize.set($event)"
          />
        </div>
      }

      <!-- Add / Edit Product Modal -->
      <app-admin-modal
        [title]="editingId() ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'"
        [isOpen]="isModalOpen()"
        (close)="closeModal()"
      >
        <form class="admin-form" (ngSubmit)="saveProduct()">
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

          <div class="admin-form__row">
            <div class="admin-form__field">
              <label>Marque *</label>
              <input
                type="text"
                [(ngModel)]="formBrand"
                name="brand"
                required
                maxlength="100"
                placeholder="Ex: Wahl, Kérastase..."
                (input)="formError.set(null)"
              />
            </div>
            <div class="admin-form__field">
              <label>Titre du produit *</label>
              <input
                type="text"
                [(ngModel)]="formTitle"
                name="title"
                required
                maxlength="200"
                placeholder="Ex: Tondeuse Sans Fil"
                (input)="formError.set(null)"
              />
            </div>
          </div>

          <div class="admin-form__row">
            <div class="admin-form__field">
              <label>Prix de vente (FCFA) *</label>
              <input
                type="number"
                [(ngModel)]="formPrice"
                name="price"
                min="0"
                required
                placeholder="35000"
                (input)="formError.set(null)"
              />
            </div>
            <div class="admin-form__field">
              <label>Catégorie de rattachement *</label>
              <select [(ngModel)]="formCategoryId" name="categoryId" (change)="formError.set(null)">
                @if (data.categories().length === 0) {
                  <option value="">Aucune catégorie disponible</option>
                }
                @for (cat of data.categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="admin-form__field">
            <label>Description courte</label>
            <input
              type="text"
              [(ngModel)]="formDesc"
              name="desc"
              maxlength="500"
              placeholder="Ex: Idéal pour barbes et cheveux..."
            />
          </div>

          <app-admin-image-uploader
            label="Photo du produit"
            [(imageUrl)]="formImageUrl"
          />
        </form>

        <div footer-actions>
          <button
            type="button"
            class="admin-btn admin-btn--primary"
            [disabled]="isSubmitting()"
            (click)="saveProduct()"
          >
            @if (isSubmitting()) {
              <span class="admin-btn-spinner"></span>
              <span>Enregistrement en cours...</span>
            } @else {
              <span>{{ editingId() ? 'Enregistrer les modifications' : 'Ajouter le produit' }}</span>
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
  styleUrl: './admin-boutique-page.scss'
})
export class AdminBoutiquePage {
  protected readonly data = inject(AdminDataService);
  private readonly confirmService = inject(AdminConfirmService);

  protected searchQuery = '';
  protected categoryFilter = 'all';
  protected viewMode: AdminViewMode = 'table';

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly isModalOpen = signal<boolean>(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly successToast = signal<string | null>(null);

  protected formBrand = '';
  protected formTitle = '';
  protected formPrice = 25000;
  protected formCategoryId = '';
  protected formDesc = '';
  protected formImageUrl = '';

  protected readonly filteredProducts = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const cat = this.categoryFilter;

    return this.data.products().filter(p => {
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);

      const matchCategory = cat === 'all' || p.categoryId === cat || this.data.getCategoryName(p.categoryId).toLowerCase() === cat.toLowerCase();

      return matchQuery && matchCategory;
    });
  });

  protected readonly paginatedProducts = computed(() => {
    const list = this.filteredProducts();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  protected formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  protected openAddModal(): void {
    this.editingId.set(null);
    this.formBrand = '';
    this.formTitle = '';
    this.formPrice = 25000;
    this.formCategoryId = this.data.categories()[0]?.id || '';
    this.formDesc = '';
    this.formImageUrl = 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80';
    this.formError.set(null);
    this.isSubmitting.set(false);
    this.isModalOpen.set(true);
  }

  protected openEditModal(p: Product): void {
    this.editingId.set(p.id);
    this.formBrand = p.brand;
    this.formTitle = p.title;
    this.formPrice = p.price;
    this.formCategoryId = p.categoryId;
    this.formDesc = p.description;
    this.formImageUrl = p.images[0] || '';
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

  protected saveProduct(): void {
    const brand = this.formBrand.trim();
    const title = this.formTitle.trim();

    if (!brand) {
      this.formError.set('La marque du produit est obligatoire (ex: Wahl, Kérastase).');
      return;
    }
    if (!title) {
      this.formError.set('Le titre du produit est obligatoire.');
      return;
    }
    if (this.formPrice === null || this.formPrice === undefined || isNaN(this.formPrice) || this.formPrice < 0) {
      this.formError.set('Veuillez renseigner un prix de vente valide supérieur ou égal à 0.');
      return;
    }

    const catId = this.formCategoryId || this.data.categories()[0]?.id;
    if (!catId) {
      this.formError.set('Veuillez créer et sélectionner une catégorie avant d\'ajouter un produit.');
      return;
    }

    this.formError.set(null);
    this.isSubmitting.set(true);

    const imageUrl = this.formImageUrl || 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80';

    if (this.editingId()) {
      this.data.updateProduct(this.editingId()!, {
        brand: brand,
        title: title,
        price: Number(this.formPrice),
        categoryId: catId,
        description: this.formDesc.trim(),
        images: [imageUrl]
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isModalOpen.set(false);
          this.showSuccess('Produit mis à jour avec succès !');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(this.extractError(err, 'Impossible de modifier le produit. Vérifiez les informations saisies.'));
        }
      });
    } else {
      const newProduct: Product = {
        id: '',
        brand: brand,
        title: title,
        price: Number(this.formPrice),
        categoryId: catId,
        description: this.formDesc.trim(),
        images: [imageUrl],
        rating: 5.0,
        inStock: true
      };

      this.data.addProduct(newProduct).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isModalOpen.set(false);
          this.showSuccess('Produit ajouté à la boutique avec succès !');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(this.extractError(err, 'Impossible d\'ajouter le produit. Vérifiez les données ou la connexion.'));
        }
      });
    }
  }

  protected async deleteProduct(product: Product): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Suppression de Produit',
      message: `Êtes-vous sûr de vouloir supprimer définitivement le produit "${product.title}" de la boutique ?`,
      confirmLabel: 'Supprimer le produit',
      variant: 'danger'
    });
    if (confirmed) {
      this.data.deleteProduct(product.id).subscribe({
        next: () => {
          this.showSuccess(`Le produit "${product.title}" a été supprimé.`);
        },
        error: (err) => {
          alert(this.extractError(err, 'Échec de la suppression du produit.'));
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
      return 'Impossible de contacter le serveur backend. Vérifiez que le serveur est démarré.';
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
