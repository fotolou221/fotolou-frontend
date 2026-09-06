import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, forkJoin, throwError } from 'rxjs';
import { Ticket, TicketTab, TicketStatus } from '../models/ticket';
import { API_CONFIG } from '../../core/config/api.config';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly baseUrl = API_CONFIG.baseUrl;

  // ── State Signals ───────────────────────────────────────────
  readonly activeTab = signal<TicketTab>('active');
  readonly tickets = signal<readonly Ticket[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

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
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any[]>(`${this.baseUrl}/tickets/my-tickets`).pipe(
      map((data) =>
        data.map((t) => {
          const st = (t.status || 'waiting').toLowerCase();
          const isHistory = st === 'served' || st === 'cancelled' || st === 'completed';
          const rawCat = (t.category || '').toLowerCase();
          const cat: TicketTab = rawCat === 'history' || isHistory ? 'history' : 'active';
          return {
            ...t,
            id: t.id ? t.id.toString() : `t-${Date.now()}`,
            salonId: t.salonId || t.salon?.slug || (t.salon?.id ? t.salon.id.toString() : 'king-barber'),
            salonName: t.salonName || t.salon?.name || 'King Barber',
            ownerName: t.ownerName || t.customerName || 'Moi',
            ticketNumber: t.ticketNumber || t.dailySequenceNumber || 1,
            status: st as TicketStatus,
            category: cat,
            createdAt: t.createdAt || t.createdDate || new Date().toISOString()
          };
        })
      ),
      tap((data) => {
        this.tickets.set(data);
        this.loading.set(false);
      }),
      catchError((err) => {
        console.error('[TicketService] Error fetching tickets:', err);
        this.error.set('Impossible de charger vos tickets.');
        this.loading.set(false);
        return of([]);
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
          ownerName: t.ownerName || t.customerName || 'Moi',
          ticketNumber: t.ticketNumber || t.dailySequenceNumber || 1,
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
          ownerName: saved.ownerName || ownerName || 'Moi',
          ticketNumber: saved.ticketNumber || (activeCount + 1),
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
        return throwError(() => err);
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
              ownerName: saved.ownerName || ownerNames[idx] || 'Moi',
              ticketNumber: saved.ticketNumber || (activeCount + idx + 1),
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
        return throwError(() => err);
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
          status: st as TicketStatus,
          category: (saved.category ? saved.category.toLowerCase() : (isHistory ? 'history' : 'active')) as TicketTab,
          createdAt: saved.createdDate || new Date().toISOString()
        };
      }),
      tap((savedTicket) => {
        this.tickets.update((prev) => [...prev, savedTicket]);
        this.loadTickets();
      }),
      catchError((err) => {
        console.error('[TicketService] Erreur walk-in:', err);
        throw err;
      })
    );
  }

  callTicket(id: string): Observable<Ticket | null> {
    return this.http.post<any>(`${this.baseUrl}/tickets/${id}/call-next`, {}).pipe(
      tap(() => this.loadTickets()),
      catchError((err) => {
        console.warn(`[TicketService] Erreur call ticket ${id}:`, err);
        return of(null);
      })
    );
  }

  cancelTicket(id: string): Observable<Ticket | null> {
    const now = new Date().toISOString();
    this.tickets.update((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, status: 'cancelled', category: 'history', servedAt: now }
          : ticket
      )
    );

    return this.http.post<any>(`${this.baseUrl}/tickets/${id}/cancel`, {}).pipe(
      tap(() => this.loadTickets()),
      catchError((err) => {
        console.warn(`[TicketService] Erreur cancel ticket ${id}:`, err);
        return of(null);
      })
    );
  }

  serveTicket(id: string): Observable<Ticket | null> {
    const now = new Date().toISOString();
    this.tickets.update((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, status: 'served', category: 'history', servedAt: now }
          : ticket
      )
    );

    return this.http.post<any>(`${this.baseUrl}/tickets/${id}/serve`, {}).pipe(
      tap(() => this.loadTickets()),
      catchError((err) => {
        console.warn(`[TicketService] Erreur serve ticket ${id}:`, err);
        return of(null);
      })
    );
  }
}
