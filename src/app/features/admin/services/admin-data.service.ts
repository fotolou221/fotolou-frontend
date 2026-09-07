import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap, Observable, map, throwError } from 'rxjs';

export function generateSlug(text: string): string {
  return (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
import { SalonService } from '../../../shared/services/salon.service';
import { TicketService } from '../../../shared/services/ticket.service';
import { ProductService } from '../../../shared/services/product.service';
import { Salon } from '../../../shared/models/salon';
import { Ticket, TicketStatus } from '../../../shared/models/ticket';
import { Product, ProductCategory } from '../../../shared/models/product';
import { Order, OrderStatus } from '../../../shared/models/order';
import { API_CONFIG } from '../../../core/config/api.config';

export interface AdminCoiffeur {
  id: string;
  name: string;
  phone: string;
  salonId: string;
  salonName: string;
  specialty: string;
  active: boolean;
  avatarUrl: string;
  ticketsServedCount: number;
}

export interface AdminClientUser {
  id: string;
  name: string;
  phone: string;
  district: string;
  avatarUrl?: string;
  role?: 'client' | 'coiffeur' | 'admin';
  ticketsCount: number;
  relativesCount: number;
  createdAt: string;
}

export interface AdminCategoryItem {
  id: string;
  rawId?: number;
  slug?: string;
  name: string;
  description: string;
  image: string;
  icon: string;
}

export interface PlatformSettings {
  appName: string;
  contactEmail: string;
  contactPhone: string;
  commissionRate: number; // percentage
  openingTime: string;
  closingTime: string;
  allowRelativeBooking: boolean;
  maintenanceMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDataService {
  private readonly salonService = inject(SalonService);
  private readonly ticketService = inject(TicketService);
  private readonly productService = inject(ProductService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  constructor() {
    this.loadFromBackend();
  }

  loadFromBackend(): void {
    // 1. Dashboard KPIs & Live Stats (Aggregate metrics)
    this.http.get<any>(`${this.baseUrl}/admin/dashboard-stats`).pipe(
      catchError(() => of(null))
    ).subscribe();

    // 2. Salons (Single source of truth)
    this.loadSalons();

    // 3. Product Categories
    this.loadCategories();

    // 4. Products
    this.loadProducts();

    // 5. Orders
    this.http.get<any[]>(`${this.baseUrl}/orders`).pipe(
      tap((orders) => {
        if (Array.isArray(orders)) {
          this.orders.set(orders.map((o: any) => ({
            id: o.id ? o.id.toString() : `ord-${Date.now()}`,
            orderNumber: o.orderNumber || 'CMD-2026-001',
            status: (o.status ? o.status.toLowerCase() : 'en_cours') as OrderStatus,
            orderType: (o.orderType ? o.orderType.toLowerCase() : 'whatsapp') as any,
            items: Array.isArray(o.items) ? o.items : [],
            subtotal: Number(o.subtotal) || 0,
            deliveryFee: Number(o.deliveryFee) || 2000,
            totalPrice: Number(o.totalPrice) || 0,
            createdAt: o.createdAt || o.createdDate || new Date().toISOString()
          })));
        }
      }),
      catchError(() => of([]))
    ).subscribe();

    // 6. Tickets
    this.http.get<any[]>(`${this.baseUrl}/tickets`).pipe(
      tap((tickets) => {
        if (Array.isArray(tickets)) {
          this.tickets.set(tickets.map((t: any) => ({
            id: t.id ? t.id.toString() : `t-${Date.now()}`,
            salonId: t.salon?.slug || t.salon?.id?.toString() || 'salon',
            salonName: t.salon?.name || 'Salon Fotolou',
            ownerName: t.ownerName || 'Client',
            ticketNumber: Number(t.ticketNumber) || 1,
            status: (t.status ? t.status.toLowerCase() : 'waiting') as TicketStatus,
            category: (t.status === 'served' || t.status === 'completed' || t.status === 'cancelled') ? 'history' : 'active',
            createdAt: t.createdAt || t.createdDate || new Date().toISOString(),
            servedAt: t.servedAt
          })));
        }
      }),
      catchError(() => of([]))
    ).subscribe();

    // 7. Coiffeurs Profiles
    this.http.get<any[]>(`${this.baseUrl}/coiffeurs`).pipe(
      tap((coiffs) => {
        if (Array.isArray(coiffs)) {
          this.coiffeurs.set(coiffs.map((c: any) => ({
            id: c.id ? c.id.toString() : `c-${Date.now()}`,
            name: c.user ? `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || c.name || 'Coiffeur' : (c.name || 'Coiffeur'),
            phone: c.user?.login || c.phone || '+221 77 000 00 00',
            salonId: c.salon?.slug || c.salon?.id?.toString() || '',
            salonName: c.salon?.name || 'Salon Fotolou',
            specialty: c.specialty || 'Coiffure & Barbe',
            active: c.active !== false,
            avatarUrl: c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            ticketsServedCount: c.ticketsServedCount || 0
          })));
        }
      }),
      catchError(() => of([]))
    ).subscribe();

    // 8. Clients / Users
    this.loadUsers();

    // 9. Platform Settings
    this.http.get<any>(`${this.baseUrl}/platform-settings`).pipe(
      tap((res) => {
        const s = Array.isArray(res) ? res[0] : res;
        if (s) {
          this.settings.set({
            appName: s.appName || 'Fotolou Admin',
            contactEmail: s.contactEmail || 'support@fotolou.sn',
            contactPhone: s.contactPhone || '+221 77 862 70 52',
            commissionRate: Number(s.commissionRate) || 10,
            openingTime: s.openingTime || '09:00',
            closingTime: s.closingTime || '21:00',
            allowRelativeBooking: s.allowRelativeBooking === true || s.allowRelativeBooking === 'true',
            maintenanceMode: s.maintenanceMode === true || s.maintenanceMode === 'true'
          });
        }
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  // ── Reactive Signals (Initialized cleanly for production) ──
  readonly salons = signal<Salon[]>([]);
  readonly coiffeurs = signal<AdminCoiffeur[]>([]);
  readonly categories = signal<AdminCategoryItem[]>([]);
  readonly tickets = signal<Ticket[]>([]);
  readonly products = signal<Product[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly clients = signal<AdminClientUser[]>([]);

  // ── Platform Settings State ───────────────────────────────
  readonly settings = signal<PlatformSettings>({
    appName: 'Fotolou Admin',
    contactEmail: 'support@fotolou.sn',
    contactPhone: '+221 77 862 70 52',
    commissionRate: 10,
    openingTime: '08:30',
    closingTime: '21:00',
    allowRelativeBooking: true,
    maintenanceMode: false
  });

  // ── Derived Global Stats ──────────────────────────────────
  readonly stats = computed(() => {
    const totalSalons = this.salons().length;
    const openSalons = this.salons().filter(s => s.status === 'open').length;
    const totalCoiffeurs = this.coiffeurs().length;
    const totalCategories = this.categories().length;
    const activeTickets = this.tickets().filter(t => t.status === 'waiting' || t.status === 'your_turn').length;
    const servedTickets = this.tickets().filter(t => t.status === 'served' || t.status === 'completed').length;
    const totalOrders = this.orders().length;
    const totalRevenue = this.orders()
      .filter(o => o.status === 'livre' || o.status === 'en_cours')
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const totalClients = this.clients().length;

    return {
      totalSalons,
      openSalons,
      totalCoiffeurs,
      totalCategories,
      activeTickets,
      servedTickets,
      totalOrders,
      totalRevenue,
      totalClients
    };
  });

  loadSalons(): void {
    this.http.get<any[]>(`${this.baseUrl}/salons`).pipe(
      tap((salons) => {
        if (Array.isArray(salons)) {
          this.salons.set(salons.map((s: any) => ({
            ...s,
            id: s.slug || s.id?.toString() || 'salon',
            status: s.status ? s.status.toLowerCase() : 'open',
            avatarUrl: s.avatarUrl || 'images/salons/king-barber-avatar.png',
            coverUrl: s.coverUrl || 'images/salons/king-barber-cover.png',
            actions: Array.isArray(s.actions) && s.actions.length > 0 ? s.actions : [
              { label: 'Site web', icon: 'globe', href: '#' },
              { label: 'Appeler', icon: 'phone', href: `tel:${s.phone || '+221771234567'}` },
              { label: 'Itinéraire', icon: 'navigation', href: '#' },
              { label: 'Partager', icon: 'share', href: '#' }
            ]
          })));
        }
      }),
      catchError(() => of([]))
    ).subscribe();
  }

  // ── Salon CRUD ────────────────────────────────────────────
  addSalon(salon: Salon, ownerInfo?: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }): Observable<boolean> {
    const slug = salon.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const payload = {
      name: salon.name,
      slug: slug || 'salon-' + Date.now(),
      location: salon.location || 'Dakar, Sénégal',
      district: salon.district || 'Dakar',
      status: (salon.status || 'open').toUpperCase(),
      phone: salon.phone || '+221 77 000 00 00',
      avatarUrl: salon.avatarUrl || 'images/salons/king-barber-avatar.png',
      coverUrl: salon.coverUrl || 'images/salons/king-barber-cover.png',
      latitude: salon.latitude || 14.716677,
      longitude: salon.longitude || -17.467686,
      peopleWaiting: 0,
      estimatedWaitMinutes: 0,
      active: true
    };

    // 1. Persist Salon to Backend
    return this.http.post<any>(`${this.baseUrl}/salons`, payload).pipe(
      tap((res) => {
        const savedSalon: Salon = {
          ...salon,
          id: res.slug || (res.id ? res.id.toString() : salon.id),
          status: res.status ? res.status.toLowerCase() : (salon.status || 'open')
        };
        this.salons.update(list => [savedSalon, ...list]);
        this.loadSalons();
        this.salonService.loadSalons();

        // 2. Persist Coiffeur Owner as User in Backend
        const ownerPhone = (ownerInfo?.phone || salon.phone || '').replace(/\s+/g, '');
        if (ownerPhone) {
          const userPayload = {
            login: ownerPhone,
            firstName: ownerInfo?.firstName || salon.ownerName?.split(' ')[0] || 'Coiffeur',
            lastName: ownerInfo?.lastName || salon.ownerName?.split(' ').slice(1).join(' ') || 'Propriétaire',
            email: `${ownerPhone.replace('+', '')}@fotolou.sn`,
            imageUrl: ownerInfo?.avatarUrl || salon.avatarUrl,
            authorities: ['ROLE_USER', 'ROLE_COIFFEUR'],
            activated: true,
            langKey: 'fr'
          };

          this.http.post(`${this.baseUrl}/admin/users`, userPayload).pipe(
            tap(() => this.loadUsers()),
            catchError((err) => {
              console.warn('[AdminDataService] Auto-create coiffeur user error:', err);
              return of(null);
            })
          ).subscribe();
        }
      }),
      map(() => true),
      catchError((err) => {
        console.error('[AdminDataService] addSalon backend error:', err);
        return of(false);
      })
    );
  }

  updateSalon(id: string, updates: Partial<Salon>): void {
    this.salons.update(list =>
      list.map(s => (s.id === id ? { ...s, ...updates } : s))
    );

    const numId = Number(id);
    const payload: any = {
      name: updates.name,
      district: updates.district,
      location: updates.location,
      phone: updates.phone,
      coverUrl: updates.coverUrl,
      avatarUrl: updates.avatarUrl || updates.coverUrl,
      latitude: updates.latitude,
      longitude: updates.longitude,
      status: updates.status ? updates.status.toUpperCase() : undefined,
      active: true
    };

    if (!isNaN(numId)) {
      payload.id = numId;
      this.http.patch(`${this.baseUrl}/salons/${numId}`, payload).pipe(
        tap(() => {
          this.loadFromBackend();
          this.salonService.loadSalons();
        }),
        catchError(() => of(null))
      ).subscribe();
    } else {
      this.http.get<any[]>(`${this.baseUrl}/salons`).subscribe((allSalons) => {
        const found = allSalons?.find((s: any) => s.slug === id || s.id?.toString() === id);
        if (found && found.id) {
          payload.id = found.id;
          this.http.patch(`${this.baseUrl}/salons/${found.id}`, payload).pipe(
            tap(() => {
              this.loadFromBackend();
              this.salonService.loadSalons();
            }),
            catchError(() => of(null))
          ).subscribe();
        }
      });
    }
  }

  deleteSalon(id: string): void {
    this.salons.update(list => list.filter(s => s.id !== id));

    const numId = Number(id);
    if (!isNaN(numId)) {
      this.http.delete(`${this.baseUrl}/salons/${numId}`).pipe(
        tap(() => {
          this.loadFromBackend();
          this.salonService.loadSalons();
        }),
        catchError(() => of(null))
      ).subscribe();
    } else {
      this.http.get<any[]>(`${this.baseUrl}/salons`).subscribe((allSalons) => {
        const found = allSalons?.find((s: any) => s.slug === id || s.id?.toString() === id);
        if (found && found.id) {
          this.http.delete(`${this.baseUrl}/salons/${found.id}`).pipe(
            tap(() => {
              this.loadFromBackend();
              this.salonService.loadSalons();
            }),
            catchError(() => of(null))
          ).subscribe();
        }
      });
    }
  }

  toggleSalonStatus(id: string): void {
    const current = this.salons().find(s => s.id === id);
    const newStatus = current?.status === 'open' ? 'closed' : 'open';
    this.updateSalon(id, { status: newStatus });
  }

  // ── Coiffeur CRUD ─────────────────────────────────────────
  addCoiffeur(coiffeur: AdminCoiffeur): void {
    this.coiffeurs.update(list => [coiffeur, ...list]);
  }

  updateCoiffeur(id: string, updates: Partial<AdminCoiffeur>): void {
    this.coiffeurs.update(list =>
      list.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  deleteCoiffeur(id: string): void {
    this.coiffeurs.update(list => list.filter(c => c.id !== id));
  }

  toggleCoiffeurActive(id: string): void {
    this.coiffeurs.update(list =>
      list.map(c => (c.id === id ? { ...c, active: !c.active } : c))
    );
  }

  // ── Categories & Products Loading ─────────────────────────
  loadCategories(): void {
    this.http.get<any[]>(`${this.baseUrl}/product-categories`).pipe(
      tap((cats) => {
        if (Array.isArray(cats)) {
          this.categories.set(cats.map((c: any) => ({
            id: c.id ? c.id.toString() : (c.slug || 'cat'),
            rawId: typeof c.id === 'number' ? c.id : (Number(c.id) || undefined),
            slug: c.slug || c.id?.toString() || 'cat',
            name: c.name || '',
            description: c.description || '',
            image: c.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
            icon: c.icon || 'category'
          })));
        }
      }),
      catchError((err) => {
        console.error('[AdminDataService] Error loading categories:', err);
        return of([]);
      })
    ).subscribe();
  }

  loadProducts(): void {
    this.http.get<any[]>(`${this.baseUrl}/products`).pipe(
      tap((prods) => {
        if (Array.isArray(prods)) {
          this.products.set(prods.map((p: any) => ({
            id: p.id ? p.id.toString() : `prod-${Date.now()}`,
            brand: p.brand || 'Fotolou',
            title: p.title || '',
            description: p.description || '',
            price: Number(p.price) || 0,
            oldPrice: p.oldPrice ? Number(p.oldPrice) : undefined,
            rating: p.rating || 4.8,
            categoryId: p.category?.id?.toString() || p.category?.slug || (typeof p.category === 'string' ? p.category : (p.categoryId || '')),
            images: Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : (Array.isArray(p.imageses) && p.imageses.length > 0
                  ? p.imageses.map((img: any) => img.imageUrl || img)
                  : ['https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80']),
            inStock: p.inStock !== false
          })));
        }
      }),
      catchError((err) => {
        console.error('[AdminDataService] Error loading products:', err);
        return of([]);
      })
    ).subscribe();
  }

  // ── Categories CRUD ───────────────────────────────────────
  addCategory(category: AdminCategoryItem): Observable<any> {
    const cleanName = (category.name || '').trim();
    if (!cleanName) {
      return throwError(() => new Error('Le nom de la catégorie est obligatoire.'));
    }

    const baseSlug = category.slug?.trim() || generateSlug(cleanName) || 'cat';
    const slug = baseSlug.slice(0, 95);

    const payload = {
      name: cleanName.slice(0, 100),
      slug: slug,
      description: (category.description || '').slice(0, 500),
      image: (category.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80').slice(0, 500),
      icon: (category.icon || 'category').slice(0, 50)
    };

    return this.http.post<any>(`${this.baseUrl}/product-categories`, payload).pipe(
      tap((res) => {
        const newCat: AdminCategoryItem = {
          id: res.id ? res.id.toString() : (res.slug || slug),
          rawId: res.id,
          slug: res.slug || slug,
          name: res.name || cleanName,
          description: res.description || category.description,
          image: res.image || category.image,
          icon: res.icon || category.icon
        };
        this.categories.update(list => [newCat, ...list]);
        this.loadCategories();
        this.productService.loadCategories();
      }),
      catchError((err) => {
        console.error('[AdminDataService] Error adding category:', err);
        return throwError(() => err);
      })
    );
  }

  updateCategory(id: string, updates: Partial<AdminCategoryItem>): Observable<any> {
    const current = this.categories().find(c => c.id === id || c.slug === id || c.rawId?.toString() === id);
    let rawId = current?.rawId || (!isNaN(Number(id)) ? Number(id) : null);

    if (!rawId) {
      return throwError(() => new Error('Catégorie introuvable pour la modification.'));
    }

    const cleanName = (updates.name !== undefined ? updates.name : current?.name || '').trim();
    if (!cleanName) {
      return throwError(() => new Error('Le nom de la catégorie ne peut pas être vide.'));
    }

    const payload: any = {
      id: rawId,
      name: cleanName.slice(0, 100),
      slug: (updates.slug || current?.slug || generateSlug(cleanName)).slice(0, 100),
      description: (updates.description !== undefined ? updates.description : (current?.description || '')).slice(0, 500),
      image: (updates.image !== undefined ? updates.image : (current?.image || '')).slice(0, 500),
      icon: (updates.icon !== undefined ? updates.icon : (current?.icon || 'category')).slice(0, 50)
    };

    return this.http.patch<any>(`${this.baseUrl}/product-categories/${rawId}`, payload, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(
      tap(() => {
        this.loadCategories();
        this.productService.loadCategories();
      }),
      catchError((err) => {
        console.error('[AdminDataService] Error updating category:', err);
        return throwError(() => err);
      })
    );
  }

  deleteCategory(id: string): Observable<any> {
    const current = this.categories().find(c => c.id === id || c.slug === id || c.rawId?.toString() === id);
    const rawId = current?.rawId || (!isNaN(Number(id)) ? Number(id) : null);

    if (rawId) {
      return this.http.delete(`${this.baseUrl}/product-categories/${rawId}`).pipe(
        tap(() => {
          this.categories.update(list => list.filter(c => c.id !== id && c.rawId !== rawId));
          this.loadCategories();
          this.productService.loadCategories();
        }),
        catchError((err) => {
          console.error('[AdminDataService] Error deleting category:', err);
          return throwError(() => err);
        })
      );
    }
    this.categories.update(list => list.filter(c => c.id !== id));
    return of(true);
  }

  getProductsCountByCategory(categoryId: string): number {
    const cat = this.categories().find(c => c.id === categoryId || c.slug === categoryId || c.rawId?.toString() === categoryId);
    return this.products().filter(p =>
      p.categoryId === categoryId ||
      (cat && (p.categoryId === cat.id || p.categoryId === cat.slug || p.categoryId === cat.rawId?.toString()))
    ).length;
  }

  getCategoryName(categoryId: string): string {
    const cat = this.categories().find(c => c.id === categoryId || c.slug === categoryId || c.rawId?.toString() === categoryId);
    return cat ? cat.name : (categoryId || 'Sans catégorie');
  }

  // ── Ticket Actions ────────────────────────────────────────
  callNextTicket(ticketId: string): void {
    this.tickets.update(list =>
      list.map(t => (t.id === ticketId ? { ...t, status: 'your_turn' as TicketStatus } : t))
    );
  }

  markTicketServed(ticketId: string): void {
    this.tickets.update(list =>
      list.map(t =>
        t.id === ticketId
          ? { ...t, status: 'served' as TicketStatus, category: 'history', servedAt: new Date().toISOString() }
          : t
      )
    );
    this.ticketService.serveTicket(ticketId).subscribe({ error: () => {} });
  }

  cancelTicket(ticketId: string): void {
    this.tickets.update(list =>
      list.map(t =>
        t.id === ticketId
          ? { ...t, status: 'cancelled' as TicketStatus, category: 'history', servedAt: new Date().toISOString() }
          : t
      )
    );
    this.ticketService.cancelTicket(ticketId).subscribe({ error: () => {} });
  }

  // ── Product CRUD ──────────────────────────────────────────
  addProduct(product: Product): Observable<any> {
    if (!product.title?.trim() || !product.brand?.trim()) {
      return throwError(() => new Error('La marque et le titre du produit sont obligatoires.'));
    }

    const price = Math.max(0, Math.round(Number(product.price) || 0));

    let categoryDbId: number | null = null;
    const cat = this.categories().find(
      c => c.id === product.categoryId || c.slug === product.categoryId || c.rawId?.toString() === product.categoryId
    );
    if (cat && cat.rawId) {
      categoryDbId = cat.rawId;
    } else if (!isNaN(Number(product.categoryId))) {
      categoryDbId = Number(product.categoryId);
    } else if (this.categories().length > 0 && this.categories()[0].rawId) {
      categoryDbId = this.categories()[0].rawId!;
    }

    if (!categoryDbId) {
      return throwError(() => new Error('Aucune catégorie trouvée. Veuillez d\'abord créer au moins une catégorie dans l\'onglet Catégories.'));
    }

    const payload: any = {
      brand: product.brand.trim().slice(0, 100),
      title: product.title.trim().slice(0, 200),
      price: price,
      oldPrice: product.oldPrice ? Math.max(0, Math.round(Number(product.oldPrice))) : null,
      rating: product.rating || 5.0,
      inStock: product.inStock !== false,
      description: product.description || '',
      category: { id: categoryDbId },
      images: Array.isArray(product.images) && product.images.length > 0
        ? product.images.map(img => (img || '').slice(0, 500)).filter(img => !!img)
        : ['https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80']
    };

    return this.http.post<any>(`${this.baseUrl}/products`, payload).pipe(
      tap((res) => {
        const createdProduct: Product = {
          ...product,
          id: res.id ? res.id.toString() : product.id,
          categoryId: categoryDbId!.toString()
        };
        this.products.update(list => [createdProduct, ...list]);
        this.loadProducts();
        this.productService.loadProducts();
      }),
      catchError((err) => {
        console.error('[AdminDataService] Error creating product:', err);
        return throwError(() => err);
      })
    );
  }

  updateProduct(id: string, updates: Partial<Product>): Observable<any> {
    const current = this.products().find(p => p.id === id);
    let numId = Number(id);
    if (isNaN(numId) && current?.id && !isNaN(Number(current.id))) {
      numId = Number(current.id);
    }

    if (isNaN(numId)) {
      return throwError(() => new Error('Identifiant de produit introuvable pour la modification.'));
    }

    let categoryDbId: number | null = null;
    const targetCatId = updates.categoryId || current?.categoryId;
    if (targetCatId) {
      const cat = this.categories().find(
        c => c.id === targetCatId || c.slug === targetCatId || c.rawId?.toString() === targetCatId
      );
      if (cat && cat.rawId) {
        categoryDbId = cat.rawId;
      } else if (!isNaN(Number(targetCatId))) {
        categoryDbId = Number(targetCatId);
      }
    }
    if (!categoryDbId && this.categories().length > 0 && this.categories()[0].rawId) {
      categoryDbId = this.categories()[0].rawId!;
    }

    const payload: any = {
      id: numId,
      brand: (updates.brand?.trim() || current?.brand || 'Fotolou').slice(0, 100),
      title: (updates.title?.trim() || current?.title || '').slice(0, 200),
      price: updates.price !== undefined ? Math.max(0, Math.round(Number(updates.price))) : (current ? Number(current.price) : 0),
      oldPrice: updates.oldPrice !== undefined ? Math.max(0, Math.round(Number(updates.oldPrice))) : (current?.oldPrice ? Number(current.oldPrice) : null),
      rating: updates.rating ?? current?.rating ?? 5.0,
      inStock: updates.inStock !== undefined ? updates.inStock : (current?.inStock !== false),
      description: updates.description ?? current?.description ?? '',
      category: categoryDbId ? { id: categoryDbId } : undefined,
      images: (updates.images || current?.images || []).map((img: string) => (img || '').slice(0, 500)).filter((img: string) => !!img)
    };

    return this.http.patch<any>(`${this.baseUrl}/products/${numId}`, payload, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(
      tap(() => {
        this.loadProducts();
        this.productService.loadProducts();
      }),
      catchError((err) => {
        console.error('[AdminDataService] Error updating product:', err);
        return throwError(() => err);
      })
    );
  }

  deleteProduct(id: string): Observable<any> {
    const numId = Number(id);
    if (!isNaN(numId)) {
      return this.http.delete(`${this.baseUrl}/products/${numId}`).pipe(
        tap(() => {
          this.products.update(list => list.filter(p => p.id !== id));
          this.loadProducts();
          this.productService.loadProducts();
        }),
        catchError((err) => {
          console.error('[AdminDataService] Error deleting product:', err);
          return throwError(() => err);
        })
      );
    }
    this.products.update(list => list.filter(p => p.id !== id));
    return of(true);
  }

  toggleProductStock(id: string): void {
    const current = this.products().find(p => p.id === id);
    if (current) {
      const newStock = !current.inStock;
      this.updateProduct(id, { inStock: newStock }).subscribe({ error: () => {} });
    }
  }

  // ── Order Management ──────────────────────────────────────
  updateOrderStatus(orderId: string, status: OrderStatus): void {
    this.orders.update(list =>
      list.map(o => (o.id === orderId ? { ...o, status } : o))
    );
  }

  loadUsers(): void {
    // Éviter l'erreur 403 si l'utilisateur n'est pas encore connecté en tant qu'administrateur
    const token = localStorage.getItem('fotolou_jwt_token') || localStorage.getItem('jhi-authenticationtoken');
    if (!token) {
      return;
    }

    this.http.get<any[]>(`${this.baseUrl}/admin/users`).pipe(
      tap((users) => {
        if (Array.isArray(users)) {
          this.clients.set(users.map((u: any) => ({
            id: u.id ? u.id.toString() : `u-${Date.now()}`,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.login || 'Utilisateur',
            phone: u.login || '+221 77 000 00 00',
            district: u.district || 'Dakar',
            avatarUrl: u.imageUrl,
            role: u.authorities?.includes('ROLE_ADMIN') ? 'admin' : (u.authorities?.includes('ROLE_COIFFEUR') ? 'coiffeur' : 'client'),
            ticketsCount: u.ticketsCount || 0,
            relativesCount: u.relativesCount || 0,
            createdAt: u.createdDate || new Date().toISOString()
          })));
        }
      }),
      catchError(() => of([]))
    ).subscribe();
  }

  addUser(user: AdminClientUser): void {
    this.clients.update(list => [user, ...list]);
    const parts = user.name.split(' ');
    const firstName = parts[0] || 'Utilisateur';
    const lastName = parts.slice(1).join(' ') || 'Fotolou';
    const cleanLogin = user.phone.replace(/\s+/g, '');
    const roleAuth = user.role === 'admin' ? 'ROLE_ADMIN' : (user.role === 'coiffeur' ? 'ROLE_COIFFEUR' : 'ROLE_CLIENT');

    const payload = {
      login: cleanLogin,
      firstName,
      lastName,
      email: `${cleanLogin.replace(/[^0-9]/g, '') || 'user'}@fotolou.sn`,
      activated: true,
      langKey: 'fr',
      authorities: ['ROLE_USER', roleAuth],
      imageUrl: user.avatarUrl
    };

    this.http.post(`${this.baseUrl}/admin/users`, payload).pipe(
      tap(() => this.loadUsers()),
      catchError((err) => {
        console.warn('[AdminDataService] Failed to create user on backend:', err);
        return of(null);
      })
    ).subscribe();
  }

  updateUser(id: string, updates: Partial<AdminClientUser>, login?: string): void {
    this.clients.update(list =>
      list.map(u => (u.id === id ? { ...u, ...updates } : u))
    );

    const userLogin = login || updates.phone?.replace(/\s+/g, '');
    if (userLogin) {
      const parts = (updates.name || '').split(' ');
      const payload = {
        login: userLogin,
        firstName: parts[0] || undefined,
        lastName: parts.slice(1).join(' ') || undefined,
        activated: true,
        langKey: 'fr',
        imageUrl: updates.avatarUrl
      };
      this.http.put(`${this.baseUrl}/admin/users`, payload).pipe(
        tap(() => this.loadUsers()),
        catchError(() => of(null))
      ).subscribe();
    }
  }

  deleteUser(id: string, login?: string): void {
    this.clients.update(list => list.filter(u => u.id !== id));
    if (login) {
      this.http.delete(`${this.baseUrl}/admin/users/${encodeURIComponent(login)}`).pipe(
        tap(() => this.loadUsers()),
        catchError(() => of(null))
      ).subscribe();
    }
  }

  // ── Settings ──────────────────────────────────────────────
  updateSettings(updates: Partial<PlatformSettings>): void {
    this.settings.update(s => ({ ...s, ...updates }));
  }
}
