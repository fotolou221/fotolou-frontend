import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { Product, ProductCategory } from '../models/product';
import { API_CONFIG } from '../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  // ── State Signals ───────────────────────────────────────────
  readonly products = signal<readonly Product[]>([]);
  readonly categories = signal<readonly ProductCategory[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

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

  loadAll(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
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
        this.loading.set(false);
      }),
      catchError((err) => {
        console.error('[ProductService] Error loading products:', err);
        this.error.set('Impossible de charger les produits de la boutique.');
        this.loading.set(false);
        return of([]);
      })
    ).subscribe();
  }

  loadCategories(): void {
    this.http.get<any[]>(`${this.baseUrl}${API_CONFIG.endpoints.categories}`).pipe(
      map((cats) =>
        cats.map((c) => ({
          id: c.slug || c.id?.toString() || 'cat',
          name: c.name || '',
          image: c.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'
        }))
      ),
      tap((cats) => this.categories.set(cats)),
      catchError((err) => {
        console.error('[ProductService] Error loading categories:', err);
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
