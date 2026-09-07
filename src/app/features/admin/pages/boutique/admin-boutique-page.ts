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
                    <td>{{ product.categoryId }}</td>
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
                  <span class="admin-product-card__cat">{{ product.categoryId }}</span>
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
        (close)="isModalOpen.set(false)"
      >
        <form class="admin-form" (ngSubmit)="saveProduct()">
          <div class="admin-form__row">
            <div class="admin-form__field">
              <label>Marque *</label>
              <input type="text" [(ngModel)]="formBrand" name="brand" required placeholder="Ex: Wahl, Kérastase..." />
            </div>
            <div class="admin-form__field">
              <label>Titre du produit *</label>
              <input type="text" [(ngModel)]="formTitle" name="title" required placeholder="Ex: Tondeuse Sans Fil" />
            </div>
          </div>

          <div class="admin-form__row">
            <div class="admin-form__field">
              <label>Prix (FCFA) *</label>
              <input type="number" [(ngModel)]="formPrice" name="price" required placeholder="35000" />
            </div>
            <div class="admin-form__field">
              <label>Catégorie *</label>
              <select [(ngModel)]="formCategoryId" name="categoryId">
                @for (cat of data.categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="admin-form__field">
            <label>Description courte</label>
            <input type="text" [(ngModel)]="formDesc" name="desc" placeholder="Ex: Idéal pour barbes et cheveux..." />
          </div>

          <app-admin-image-uploader
            label="Photo du produit"
            [(imageUrl)]="formImageUrl"
          />
        </form>

        <div footer-actions>
          <button type="button" class="admin-btn admin-btn--primary" (click)="saveProduct()">
            {{ editingId() ? 'Enregistrer les modifications' : 'Ajouter le produit' }}
          </button>
        </div>
      </app-admin-modal>

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

  protected formBrand = '';
  protected formTitle = '';
  protected formPrice = 25000;
  protected formCategoryId = 'tondeuses';
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

      const matchCategory = cat === 'all' || p.categoryId === cat;

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
    this.formCategoryId = this.data.categories()[0]?.id || 'tondeuses';
    this.formDesc = '';
    this.formImageUrl = 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80';
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
    this.isModalOpen.set(true);
  }

  protected saveProduct(): void {
    if (!this.formTitle.trim() || !this.formBrand.trim()) return;

    if (this.editingId()) {
      this.data.updateProduct(this.editingId()!, {
        brand: this.formBrand,
        title: this.formTitle,
        price: Number(this.formPrice),
        categoryId: this.formCategoryId,
        description: this.formDesc,
        images: [this.formImageUrl || 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80']
      }).subscribe();
    } else {
      const newProduct: Product = {
        id: '',
        brand: this.formBrand,
        title: this.formTitle,
        price: Number(this.formPrice),
        categoryId: this.formCategoryId,
        description: this.formDesc,
        images: [this.formImageUrl || 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80'],
        rating: 5.0,
        inStock: true
      };
      this.data.addProduct(newProduct).subscribe();
    }

    this.isModalOpen.set(false);
  }

  protected async deleteProduct(product: Product): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Suppression de Produit',
      message: `Êtes-vous sûr de vouloir supprimer définitivement le produit "${product.title}" de la boutique ?`,
      confirmLabel: 'Supprimer le produit',
      variant: 'danger'
    });
    if (confirmed) {
      this.data.deleteProduct(product.id).subscribe();
    }
  }
}
