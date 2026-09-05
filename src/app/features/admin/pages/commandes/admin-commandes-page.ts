import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { AdminBadge } from '../../components/admin-badge/admin-badge';
import { AdminPagination } from '../../components/admin-pagination/admin-pagination';
import { Order, OrderStatus } from '../../../../shared/models/order';
import { AdminConfirmService } from '../../services/admin-confirm.service';

@Component({
  selector: 'app-admin-commandes-page',
  imports: [FormsModule, AdminBadge, AdminPagination],
  template: `
    <div class="admin-page">
      
      <!-- Page Header -->
      <div class="admin-page__header">
        <div>
          <h1>Commandes Clients &bull; Boutique</h1>
          <p>Suivez les commandes passées par les utilisateurs de l'application Fotolou.</p>
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
            placeholder="Rechercher par N° de commande..."
          />
        </div>

        <div class="admin-filter-group">
          <select [(ngModel)]="statusFilter" (ngModelChange)="currentPage.set(1)">
            <option value="all">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="livre">Livrée</option>
            <option value="annule">Annulée</option>
          </select>
        </div>
      </div>

      <!-- Orders Table Card -->
      <div class="admin-card">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Articles commandés</th>
                <th>Canal</th>
                <th>Sous-total</th>
                <th>Livraison</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (order of paginatedOrders(); track order.id) {
                <tr>
                  <td>
                    <strong class="admin-table__order-num">{{ order.orderNumber }}</strong>
                    <span class="admin-table__date">{{ formatDate(order.createdAt) }}</span>
                  </td>
                  <td>
                    <div class="admin-order-items-preview">
                      @for (item of order.items; track item.product.id) {
                        <span>{{ item.quantity }}x {{ item.product.title }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="admin-badge admin-badge--info">
                      {{ order.orderType === 'whatsapp' ? 'WhatsApp' : 'Appel direct' }}
                    </span>
                  </td>
                  <td>{{ formatPrice(order.subtotal) }}</td>
                  <td>{{ formatPrice(order.deliveryFee) }}</td>
                  <td>
                    <strong class="admin-price-tag">{{ formatPrice(order.totalPrice) }}</strong>
                  </td>
                  <td>
                    <app-admin-badge [variant]="getOrderBadgeVariant(order.status)">
                      {{ getOrderStatusLabel(order.status) }}
                    </app-admin-badge>
                  </td>
                  <td style="text-align: right;">
                    <select
                      class="admin-order-status-select"
                      [value]="order.status"
                      (change)="onStatusChange(order.id, $event)"
                    >
                      <option value="en_cours">En cours</option>
                      <option value="livre">Marquer Livrée</option>
                      <option value="annule">Annuler</option>
                    </select>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="admin-table__empty">
                    Aucune commande trouvée.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <app-admin-pagination
          [totalItems]="filteredOrders().length"
          [pageSize]="pageSize()"
          [currentPage]="currentPage()"
          (pageChange)="currentPage.set($event)"
          (pageSizeChange)="pageSize.set($event)"
        />
      </div>

    </div>
  `,
  styleUrl: './admin-commandes-page.scss'
})
export class AdminCommandesPage {
  protected readonly data = inject(AdminDataService);
  private readonly confirmService = inject(AdminConfirmService);

  protected searchQuery = '';
  protected statusFilter = 'all';

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly filteredOrders = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const st = this.statusFilter;

    return this.data.orders().filter(o => {
      const matchQ = !q || o.orderNumber.toLowerCase().includes(q);
      const matchSt = st === 'all' || o.status === st;
      return matchQ && matchSt;
    });
  });

  protected readonly paginatedOrders = computed(() => {
    const list = this.filteredOrders();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  protected formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  protected formatDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  }

  protected getOrderBadgeVariant(status: OrderStatus): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'livre': return 'success';
      case 'en_cours': return 'warning';
      case 'annule': return 'danger';
      default: return 'neutral';
    }
  }

  protected getOrderStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'livre': return 'Livrée';
      case 'en_cours': return 'En cours';
      case 'annule': return 'Annulée';
      default: return status;
    }
  }

  protected async onStatusChange(orderId: string, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as OrderStatus;
    if (newStatus === 'annule') {
      const confirmed = await this.confirmService.confirm({
        title: 'Annulation de Commande',
        message: 'Êtes-vous sûr de vouloir annuler cette commande client ?',
        confirmLabel: 'Confirmer l\'annulation',
        variant: 'danger'
      });
      if (!confirmed) {
        const order = this.data.orders().find(o => o.id === orderId);
        if (order) select.value = order.status;
        return;
      }
    }
    this.data.updateOrderStatus(orderId, newStatus);
  }
}
