import { Injectable, inject, signal, computed, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, throwError, finalize } from 'rxjs';
import { Ticket, TicketTab, TicketStatus } from '../models/ticket';
import { API_CONFIG } from '../../core/config/api.config';
import { NotificationService } from './notification.service';
import { AuthSessionService } from '../../features/auth/auth-session.service';
import { HttpErrorMessageService } from './http-error-message.service';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly auth = inject(AuthSessionService);
  private readonly errorMessages = inject(HttpErrorMessageService);
  private readonly baseUrl = API_CONFIG.baseUrl;

  // ── State Signals ───────────────────────────────────────────
  readonly activeTab = signal<TicketTab>('active');
  readonly tickets = signal<readonly Ticket[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ── Cache Strategy (SWR - 1 min TTL) ────────────────────────
  private lastFetchedAt: number | null = null;
  private readonly CACHE_TTL_MS = 60 * 1000;
  private requestInFlight = false;

  // ── Computed Lists ──────────────────────────────────────────
  readonly displayedTickets = computed(() => {
    const tab = this.activeTab().toLowerCase();
    return this.tickets().filter((ticket) => (ticket.category || 'active').toLowerCase() === tab);
  });

  readonly activeCount = computed(() =>
    this.tickets().filter((t) => (t.category || 'active').toLowerCase() === 'active').length
  );

  readonly historyCount = computed(() =>
    this.tickets().filter((t) => (t.category || '').toLowerCase() === 'history').length
  );

  readonly cancelledCount = computed(() =>
    this.tickets().filter((t) => (t.status || '').toLowerCase() === 'cancelled').length
  );

  readonly coiffeurActiveTickets = computed(() =>
    this.tickets().filter((t) => (t.category || 'active').toLowerCase() === 'active')
  );

  readonly coiffeurHistoryTickets = computed(() =>
    this.tickets().filter((t) => (t.category || '').toLowerCase() === 'history')
  );

  constructor() {
    // Réaction réactive aux changements de session utilisateur
    effect(() => {
      const user = this.auth.currentUser();
      untracked(() => {
        if (user && user.id !== 'guest') {
          this.loadTickets(true);
        } else {
          this.tickets.set([]);
          this.lastFetchedAt = null;
          this.requestInFlight = false;
          this.loading.set(false);
          this.isRefreshing.set(false);
          this.error.set(null);
        }
      });
    });
  }

  loadTickets(forceRefresh: boolean = false): void {
    const user = this.auth.currentUser();
    if (!user || user.id === 'guest') {
      this.tickets.set([]);
      this.lastFetchedAt = null;
      this.loading.set(false);
      this.isRefreshing.set(false);
      return;
    }

    const now = Date.now();
    const hasData = this.tickets().length > 0;
    const isCacheValid = this.lastFetchedAt !== null && (now - this.lastFetchedAt) < this.CACHE_TTL_MS;

    // Cache-first : si les données sont déjà en mémoire et fraîches, affichage immédiat sans requête
    if (hasData && isCacheValid && !forceRefresh) {
      return;
    }

    if (this.requestInFlight) {
      return;
    }

    // Mise à jour silencieuse si données déjà présentes (pas de spinner bloquant)
    if (hasData) {
      this.isRefreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);
    this.requestInFlight = true;

    this.http.get<any[]>(`${this.baseUrl}/tickets/my-tickets`).pipe(
      map((data) =>
        (Array.isArray(data) ? data : []).map((t) => {
          const st = (t.status || 'waiting').toLowerCase();
          const isHistory = st === 'served' || st === 'cancelled' || st === 'completed';
          const rawCat = (t.category || '').toLowerCase();
          const cat: TicketTab = rawCat === 'history' || isHistory ? 'history' : 'active';
          return {
            ...t,
            id: t.id ? t.id.toString() : `t-${Date.now()}`,
            salonId: t.salonId || t.salon?.slug || (t.salon?.id ? t.salon.id.toString() : 'king-barber'),
            salonName: t.salonName || t.salon?.name || 'King Barber',
            ownerName: this.resolveOwnerName(t.ownerName || t.customerName || 'Moi', t),
            ticketNumber: t.ticketNumber || t.dailySequenceNumber || 1,
            currentTicketNumber: this.normalizeCurrentTicketNumber(t.currentTicketNumber || t.currentQueueNumber),
            status: st as TicketStatus,
            category: cat,
            createdAt: t.createdAt || t.createdDate || new Date().toISOString()
          };
        })
      ),
      tap((data) => {
        this.tickets.set(data);
        this.lastFetchedAt = Date.now();
      }),
      catchError((err) => {
        console.error('[TicketService] Error fetching tickets:', err);
        const message = this.errorMessages.message(err, 'Impossible de charger vos tickets. Verifiez votre connexion.');
        if (!hasData) {
          this.error.set(message);
        } else {
          this.error.set(message);
        }
        return of([]);
      }),
      finalize(() => {
        this.requestInFlight = false;
        this.loading.set(false);
        this.isRefreshing.set(false);
      })
    ).subscribe();
  }

  getTicketById(id: string | null): Observable<Ticket | null> {
    if (!id) return of(null);
    return this.http.get<any>(`${this.baseUrl}${API_CONFIG.endpoints.tickets}/${id}`).pipe(
      map((t) => {
        const st = (t.status || 'waiting').toLowerCase();
        const isHistory = st === 'served' || st === 'cancelled' || st === 'completed';
        const rawCat = (t.category || '').toLowerCase();
        const cat: TicketTab = rawCat === 'history' || isHistory ? 'history' : 'active';
        return {
          ...t,
          id: t.id ? t.id.toString() : id,
          salonId: t.salonId || t.salon?.slug || (t.salon?.id ? t.salon.id.toString() : 'king-barber'),
          salonName: t.salonName || t.salon?.name || 'King Barber',
          ownerName: this.resolveOwnerName(t.ownerName || t.customerName || 'Moi', t),
          ticketNumber: t.ticketNumber || t.dailySequenceNumber || 1,
          currentTicketNumber: this.normalizeCurrentTicketNumber(t.currentTicketNumber || t.currentQueueNumber),
          status: st as TicketStatus,
          category: cat,
          createdAt: t.createdAt || t.createdDate || new Date().toISOString()
        };
      }),
      catchError((err) => {
        console.error(`[TicketService] Error fetching ticket ${id}:`, err);
        return of(this.tickets().find((t) => t.id === id) || null);
      })
    );
  }

  createTicket(salonId: string, salonName: string, ownerName: string): Observable<Ticket> {
    const activeCount = this.tickets().filter((t) => (t.category || 'active').toLowerCase() === 'active').length;
    const numericSalonId = Number(salonId) || 1;

    const payload = {
      salon: { id: numericSalonId },
      ownerName: ownerName || 'Moi',
      ownerType: 'SELF',
      category: 'ACTIVE',
      status: 'WAITING'
    };

    return this.http.post<any>(`${this.baseUrl}${API_CONFIG.endpoints.tickets}`, payload).pipe(
      map((saved) => {
        const st = (saved.status ? saved.status.toLowerCase() : 'waiting') as TicketStatus;
        const isHistory = st === 'served' || st === 'cancelled' || st === 'completed';
        const rawCat = (saved.category || '').toLowerCase();
        const cat: TicketTab = rawCat === 'history' || isHistory ? 'history' : 'active';
        return {
          id: saved.id ? saved.id.toString() : `t-${Date.now()}`,
          salonId,
          salonName: saved.salon?.name || salonName,
          ownerName: this.resolveOwnerName(saved.ownerName || ownerName || 'Moi', saved),
          ticketNumber: saved.ticketNumber || (activeCount + 1),
          currentTicketNumber: this.normalizeCurrentTicketNumber(saved.currentTicketNumber || saved.currentQueueNumber),
          status: st,
          category: cat,
          createdAt: saved.createdDate || new Date().toISOString()
        };
      }),
      tap((savedTicket) => {
        this.tickets.update((prev) => [savedTicket, ...prev]);
        this.activeTab.set('active');
        this.notificationService.loadNotifications();
      }),
      catchError((err) => {
        console.error('[TicketService] Erreur création ticket:', err);
        return throwError(() => new Error(this.errorMessages.message(err, "Impossible de creer le ticket. Verifiez votre connexion.")));
      })
    );
  }

  createMultipleTickets(salonId: string, salonName: string, ownerNames: string[], salonSlug?: string): Observable<Ticket[]> {
    if (!ownerNames || ownerNames.length === 0) return of([]);

    let activeCount = this.tickets().filter((t) => (t.category || 'active').toLowerCase() === 'active').length;
    const now = Date.now();

    const numericSalonId = Number(salonId);
    const payload = {
      salonId: !isNaN(numericSalonId) ? numericSalonId : salonId,
      salonSlug: salonSlug || salonId,
      beneficiaries: ownerNames.map((name) => ({
        name: name,
        type: name.toLowerCase().includes('moi') ? 'SELF' : 'RELATIVE'
      }))
    };

    return this.http.post<any[]>(`${this.baseUrl}/tickets/book-multiple`, payload).pipe(
      map((resList) => {
        if (Array.isArray(resList) && resList.length > 0) {
          return resList.map((saved, idx) => {
            const st = (saved.status ? saved.status.toLowerCase() : (idx === 0 && activeCount === 0 ? 'your_turn' : 'waiting')) as TicketStatus;
            const isHistory = st === 'served' || st === 'cancelled' || st === 'completed';
            const rawCat = (saved.category || '').toLowerCase();
            const cat: TicketTab = rawCat === 'history' || isHistory ? 'history' : 'active';
            return {
              id: saved.id ? saved.id.toString() : `t-${now}-${idx}`,
              salonId,
              salonName: saved.salon?.name || salonName,
              ownerName: this.resolveOwnerName(saved.ownerName || ownerNames[idx] || 'Moi', saved),
              ticketNumber: saved.ticketNumber || (activeCount + idx + 1),
              currentTicketNumber: this.normalizeCurrentTicketNumber(saved.currentTicketNumber || saved.currentQueueNumber),
              status: st,
              category: cat,
              createdAt: saved.createdDate || new Date().toISOString(),
              peopleAhead: saved.peopleAhead !== undefined ? saved.peopleAhead : (activeCount + idx),
              estimatedWaitMinutes: saved.estimatedWaitMinutes || (activeCount + idx) * 20
            };
          });
        }
        return [];
      }),
      tap((savedTickets) => {
        this.tickets.update((prev) => [...savedTickets, ...prev]);
        this.activeTab.set('active');
        this.notificationService.loadNotifications();
      }),
      catchError((err) => {
        console.error('[TicketService] Erreur réservation tickets:', err);
        return throwError(() => new Error(this.errorMessages.message(err, "Impossible de reserver vos tickets. Verifiez votre connexion.")));
      })
    );
  }

  addWalkInTicket(salonId: number | string, clientName: string, clientPhone?: string): Observable<Ticket> {
    const numericSalonId = Number(salonId) || 1;
    const payload = { salonId: numericSalonId, clientName: clientName?.trim() || '', clientPhone: clientPhone?.trim() || null };
    return this.http.post<any>(`${this.baseUrl}/tickets/walk-in`, payload).pipe(
      map((saved) => {
        const st = (saved.status || 'waiting').toLowerCase();
        const isHistory = st === 'served' || st === 'cancelled' || st === 'completed';
        return {
          ...saved,
          id: saved.id ? saved.id.toString() : `t-${Date.now()}`,
          salonId: saved.salonId || (saved.salon?.id ? saved.salon.id.toString() : salonId.toString()),
          salonName: saved.salonName || saved.salon?.name || 'Mon Salon',
          ownerName: saved.ownerName || clientName || 'Client direct',
          ticketNumber: saved.ticketNumber || 1,
          currentTicketNumber: this.normalizeCurrentTicketNumber(saved.currentTicketNumber || saved.currentQueueNumber),
          status: st as TicketStatus,
          category: (saved.category ? saved.category.toLowerCase() : (isHistory ? 'history' : 'active')) as TicketTab,
          createdAt: saved.createdDate || new Date().toISOString()
        };
      }),
      tap((savedTicket) => {
        this.tickets.update((prev) => [...prev, savedTicket]);
        this.loadTickets(true);
      }),
      catchError((err) => {
        console.error('[TicketService] Erreur walk-in:', err);
        return throwError(() => new Error(this.errorMessages.message(err, "Impossible d'enregistrer ce client. Verifiez votre connexion.")));
      })
    );
  }

  callTicket(id: string): Observable<Ticket | null> {
    return this.http.post<any>(`${this.baseUrl}/tickets/${id}/call-next`, {}).pipe(
      tap(() => this.loadTickets(true)),
      catchError((err) => {
        console.warn(`[TicketService] Erreur call ticket ${id}:`, err);
        const message = this.errorMessages.message(err, "Impossible d'appeler ce client. Verifiez votre connexion.");
        this.error.set(message);
        return throwError(() => new Error(message));
      })
    );
  }

  cancelTicket(id: string): Observable<Ticket | null> {
    const now = new Date().toISOString();
    const previousTickets = this.tickets();
    this.tickets.update((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, status: 'cancelled', category: 'history', servedAt: now }
          : ticket
      )
    );

    return this.http.post<any>(`${this.baseUrl}/tickets/${id}/cancel`, {}).pipe(
      tap(() => this.loadTickets(true)),
      catchError((err) => {
        console.warn(`[TicketService] Erreur cancel ticket ${id}:`, err);
        this.tickets.set(previousTickets);
        const message = this.errorMessages.message(err, "Impossible de sortir cette personne de la file. Verifiez votre connexion.");
        this.error.set(message);
        return throwError(() => new Error(message));
      })
    );
  }

  serveTicket(id: string): Observable<Ticket | null> {
    const now = new Date().toISOString();
    const previousTickets = this.tickets();
    this.tickets.update((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, status: 'served', category: 'history', servedAt: now }
          : ticket
      )
    );

    return this.http.post<any>(`${this.baseUrl}/tickets/${id}/serve`, {}).pipe(
      tap(() => this.loadTickets(true)),
      catchError((err) => {
        console.warn(`[TicketService] Erreur serve ticket ${id}:`, err);
        this.tickets.set(previousTickets);
        const message = this.errorMessages.message(err, "Impossible de valider cette prestation. Verifiez votre connexion.");
        this.error.set(message);
        return throwError(() => new Error(message));
      })
    );
  }

  private normalizeCurrentTicketNumber(value: unknown): number | undefined {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }

  private resolveOwnerName(ownerName: unknown, rawTicket?: any): string {
    const fallback = typeof ownerName === 'string' && ownerName.trim().length > 0 ? ownerName.trim() : 'Moi';
    const user = this.auth.currentUser();
    if (!user || user.role !== 'client' || user.id === 'guest') {
      return fallback;
    }

    const profileName = this.currentProfileName();
    if (!profileName) {
      return fallback;
    }

    const ownerType = (rawTicket?.ownerType || '').toString().toUpperCase();
    if (ownerType === 'SELF' || this.looksLikeSelfOwner(fallback)) {
      return profileName;
    }

    return fallback;
  }

  private currentProfileName(): string {
    const name = this.auth.currentUser()?.name?.trim();
    if (!name || name === 'Mon Compte' || name === 'Utilisateur Fotolou') {
      return '';
    }
    return name;
  }

  private looksLikeSelfOwner(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === 'moi' ||
      normalized === 'moi-même' ||
      normalized === 'moi-meme' ||
      normalized.startsWith('moi ') ||
      normalized.startsWith('moi(')
    );
  }
}
