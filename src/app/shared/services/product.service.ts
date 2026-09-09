import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, finalize } from 'rxjs';
import { Product, ProductCategory } from '../models/product';
import { API_CONFIG } from '../../core/config/api.config';
import { HttpErrorMessageService } from './http-error-message.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly errorMessages = inject(HttpErrorMessageService);
  private readonly baseUrl = API_CONFIG.baseUrl;

  // ── State Signals ───────────────────────────────────────────
  readonly products = signal<readonly Product[]>([]);
  readonly categories = signal<readonly ProductCategory[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ── Cache Strategy (SWR - 5 min TTL) ────────────────────────
  private lastProductsFetchedAt: number | null = null;
  private lastCategoriesFetchedAt: number | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string | null>(null);

  // ── Computed Filtered List ──────────────────────────────────
  readonly filteredProducts = computed(() => {
    const list = this.products();
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();

    return list.filter((p) => {
      const matchesCategory = category ? p.categoryId === category : true;
      const matchesQuery = query
        ? p.title.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        : true;
      return matchesCategory && matchesQuery;
    });
  });

  constructor() {
    this.loadAll();
  }

  loadAll(forceRefresh: boolean = false): void {
    this.loadCategories(forceRefresh);
    this.loadProducts(forceRefresh);
  }

  loadProducts(forceRefresh: boolean = false): void {
    const now = Date.now();
    const hasData = this.products().length > 0;
    const isCacheValid = this.lastProductsFetchedAt !== null && (now - this.lastProductsFetchedAt) < this.CACHE_TTL_MS;

    if (hasData && isCacheValid && !forceRefresh) {
      return;
    }

    if (hasData) {
      this.isRefreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    this.http.get<any[]>(`${this.baseUrl}${API_CONFIG.endpoints.products}`).pipe(
      map((items) =>
        items.map((p) => ({
          id: p.id ? p.id.toString() : `prod-${Date.now()}`,
          brand: p.brand || 'Fotolou',
          title: p.title || '',
          description: p.description || '',
          price: Number(p.price) || 0,
          oldPrice: p.oldPrice ? Number(p.oldPrice) : undefined,
          rating: p.rating || 4.8,
          categoryId: p.category?.slug || (typeof p.category === 'string' ? p.category : (p.categoryId || 'tondeuses')),
          images: Array.isArray(p.images) && p.images.length > 0
            ? p.images
            : [p.category?.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'],
          inStock: p.inStock !== false
        }))
      ),
      tap((items) => {
        this.products.set(items);
        this.lastProductsFetchedAt = Date.now();
      }),
      catchError((err) => {
        console.error('[ProductService] Error loading products:', err);
        this.error.set(this.errorMessages.message(err, 'Impossible de charger les produits de la boutique. Verifiez votre connexion.'));
        return of([]);
      }),
      finalize(() => {
        this.loading.set(false);
        this.isRefreshing.set(false);
      })
    ).subscribe();
  }

  loadCategories(forceRefresh: boolean = false): void {
    const now = Date.now();
    const hasData = this.categories().length > 0;
    const isCacheValid = this.lastCategoriesFetchedAt !== null && (now - this.lastCategoriesFetchedAt) < this.CACHE_TTL_MS;

    if (hasData && isCacheValid && !forceRefresh) {
      return;
    }

    this.http.get<any[]>(`${this.baseUrl}${API_CONFIG.endpoints.categories}`).pipe(
      map((cats) =>
        cats.map((c) => ({
          id: c.slug || c.id?.toString() || 'cat',
          name: c.name || '',
          image: c.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'
        }))
      ),
      tap((cats) => {
        this.categories.set(cats);
        this.lastCategoriesFetchedAt = Date.now();
      }),
      catchError((err) => {
        console.error('[ProductService] Error loading categories:', err);
        this.error.set(this.errorMessages.message(err, 'Impossible de charger les categories de la boutique.'));
        return of([]);
      })
    ).subscribe();
  }

  getProductById(id: string | null): Observable<Product | null> {
    if (!id) return of(null);
    return this.http.get<any>(`${this.baseUrl}${API_CONFIG.endpoints.products}/${id}`).pipe(
      map((p) => ({
        id: p.id ? p.id.toString() : id,
        brand: p.brand || 'Fotolou',
        title: p.title || '',
        description: p.description || '',
        price: Number(p.price) || 0,
        oldPrice: p.oldPrice ? Number(p.oldPrice) : undefined,
        rating: p.rating || 4.8,
        categoryId: p.category?.slug || (typeof p.category === 'string' ? p.category : (p.categoryId || 'tondeuses')),
        images: Array.isArray(p.images) && p.images.length > 0
          ? p.images
          : [p.category?.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'],
        inStock: p.inStock !== false
      })),
      catchError((err) => {
        console.error(`[ProductService] Error loading product ${id}:`, err);
        this.error.set(this.errorMessages.message(err, 'Impossible de charger ce produit.'));
        return of(this.products().find((p) => p.id === id) || null);
      })
    );
  }

  toggleCategory(catId: string): void {
    if (this.selectedCategory() === catId) {
      this.selectedCategory.set(null);
    } else {
      this.selectedCategory.set(catId);
    }
  }
}
