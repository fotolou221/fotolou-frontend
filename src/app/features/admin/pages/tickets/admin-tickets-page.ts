import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { AdminBadge } from '../../components/admin-badge/admin-badge';
import { AdminPagination } from '../../components/admin-pagination/admin-pagination';
import { Ticket, TicketStatus } from '../../../../shared/models/ticket';
import { AdminConfirmService } from '../../services/admin-confirm.service';

@Component({
  selector: 'app-admin-tickets-page',
  imports: [FormsModule, AdminBadge, AdminPagination],
  template: `
    <div class="admin-page">
      
      <!-- Page Header -->
      <div class="admin-page__header">
        <div>
          <h1>Tickets &amp; Files d'Attente en Direct</h1>
          <p>Supervisez en temps réel les tickets virtuels émis et leur statut dans chaque salon.</p>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="admin-toolbar">
        <div class="admin-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="currentPage.set(1)"
            placeholder="Rechercher par numéro de ticket, client, salon..."
          />
        </div>

        <div class="admin-filter-group">
          <select [(ngModel)]="statusFilter" (ngModelChange)="currentPage.set(1)">
            <option value="all">Tous les statuts</option>
            <option value="waiting">En attente</option>
            <option value="your_turn">Au tour du client</option>
            <option value="served">Servi</option>
            <option value="cancelled">Annulé</option>
          </select>

          <select [(ngModel)]="salonFilter" (ngModelChange)="currentPage.set(1)">
            <option value="all">Tous les salons</option>
            @for (salon of data.salons(); track salon.id) {
              <option [value]="salon.id">{{ salon.name }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Tickets Table Card -->
      <div class="admin-card">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Ticket N°</th>
                <th>Client / Titulaire</th>
                <th>Salon</th>
                <th>Créé le</th>
                <th>Statut</th>
                <th style="text-align: right;">Gestion</th>
              </tr>
            </thead>
            <tbody>
              @for (ticket of paginatedTickets(); track ticket.id) {
                <tr>
                  <td>
                    <div class="admin-ticket-pill">
                      #{{ ticket.ticketNumber }}
                    </div>
                  </td>
                  <td>
                    <strong>{{ ticket.ownerName }}</strong>
                  </td>
                  <td>{{ ticket.salonName }}</td>
                  <td>
                    <span class="admin-table__date">{{ formatDate(ticket.createdAt) }}</span>
                  </td>
                  <td>
                    <app-admin-badge [variant]="getBadgeVariant(ticket.status)">
                      {{ getStatusLabel(ticket.status) }}
                    </app-admin-badge>
                  </td>
                  <td style="text-align: right;">
                    <div class="admin-table__actions">
                      @if (ticket.status === 'waiting') {
                        <button
                          type="button"
                          class="admin-table__btn-action admin-table__btn-action--call"
                          (click)="data.callNextTicket(ticket.id)"
                          title="Appeler le client"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          <span>Appeler</span>
                        </button>
                      }
                      @if (ticket.status === 'waiting' || ticket.status === 'your_turn') {
                        <button
                          type="button"
                          class="admin-table__btn-action admin-table__btn-action--serve"
                          (click)="data.markTicketServed(ticket.id)"
                          title="Marquer comme servi"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px;"><polyline points="20 6 9 17 4 12"/></svg>
                          <span>Servi</span>
                        </button>
                        <button
                          type="button"
                          class="admin-table__btn-action admin-table__btn-action--cancel"
                          (click)="onCancelTicket(ticket)"
                          title="Annuler le ticket"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="admin-table__empty">
                    Aucun ticket ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <app-admin-pagination
          [totalItems]="filteredTickets().length"
          [pageSize]="pageSize()"
          [currentPage]="currentPage()"
          (pageChange)="currentPage.set($event)"
          (pageSizeChange)="pageSize.set($event)"
        />
      </div>

    </div>
  `,
  styleUrl: './admin-tickets-page.scss'
})
export class AdminTicketsPage {
  protected readonly data = inject(AdminDataService);
  private readonly confirmService = inject(AdminConfirmService);

  protected searchQuery = '';
  protected statusFilter = 'all';
  protected salonFilter = 'all';

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly filteredTickets = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const st = this.statusFilter;
    const salon = this.salonFilter;

    return this.data.tickets().filter(t => {
      const matchQuery =
        !q ||
        t.ownerName.toLowerCase().includes(q) ||
        t.salonName.toLowerCase().includes(q) ||
        t.ticketNumber.toString().includes(q);

      const matchStatus = st === 'all' || t.status === st;
      const matchSalon = salon === 'all' || t.salonId === salon;

      return matchQuery && matchStatus && matchSalon;
    });
  });

  protected readonly paginatedTickets = computed(() => {
    const list = this.filteredTickets();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  protected getBadgeVariant(status: TicketStatus): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'your_turn': return 'primary';
      case 'waiting': return 'warning';
      case 'served':
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  }

  protected getStatusLabel(status: TicketStatus): string {
    switch (status) {
      case 'your_turn': return 'Au tour du client';
      case 'waiting': return 'En attente';
      case 'served':
      case 'completed': return 'Servi';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  protected formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' (' + date.toLocaleDateString('fr-FR') + ')';
  }
  protected async onCancelTicket(ticket: Ticket): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Annulation de Ticket',
      message: `Êtes-vous sûr de vouloir annuler le ticket #${ticket.ticketNumber} pour "${ticket.ownerName}" (${ticket.salonName}) ?`,
      confirmLabel: 'Annuler le ticket',
      variant: 'danger'
    });
    if (confirmed) {
      this.data.cancelTicket(ticket.id);
    }
  }
}
