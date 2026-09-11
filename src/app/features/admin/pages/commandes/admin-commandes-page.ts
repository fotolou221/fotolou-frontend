import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { AdminBadge } from '../../components/admin-badge/admin-badge';
import { AdminModal } from '../../components/admin-modal/admin-modal';
import { AdminPagination } from '../../components/admin-pagination/admin-pagination';
import type { OrderStatus } from '../../../../shared/models/order';
import { AdminConfirmService } from '../../services/admin-confirm.service';

interface DraftLine {
  productId: string;
  quantity: number;
}

@Component({
  selector: 'app-admin-commandes-page',
  imports: [FormsModule, AdminBadge, AdminModal, AdminPagination],
  template: `
    <div class="admin-page">
      <div class="admin-page__header">
        <div>
          <h1>Commandes Clients &bull; Boutique</h1>
          <p>Suivez, confirmez et enregistrez les commandes de la boutique Fotolou.</p>
        </div>
        <button type="button" class="admin-btn admin-btn--primary" (click)="openCreateModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Nouvelle commande (client au téléphone)</span>
        </button>
      </div>

      <div class="admin-toolbar">
        <div class="admin-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="currentPage.set(1)" placeholder="Rechercher par N° ou client..." />
        </div>

        <div class="admin-filter-group">
          <select [(ngModel)]="statusFilter" (ngModelChange)="currentPage.set(1)">
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="livre">Livrée</option>
            <option value="annule">Annulée</option>
          </select>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Canal</th>
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
                    <div>{{ order.customerName || '—' }}</div>
                    <span class="admin-table__subtext">{{ order.customerPhone || '' }}</span>
                  </td>
                  <td>
                    <div class="admin-order-items-preview">
                      @for (item of order.items; track item.product.id) {
                        <span>{{ item.quantity }}x {{ item.product.title }}</span>
                      } @empty {
                        <span class="admin-table__subtext">—</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="admin-badge admin-badge--info">
                      {{ order.orderType === 'whatsapp' ? 'WhatsApp' : 'Appel' }}
                    </span>
                  </td>
                  <td><strong class="admin-price-tag">{{ formatPrice(order.totalPrice) }}</strong></td>
                  <td>
                    <app-admin-badge [variant]="getOrderBadgeVariant(order.status)">
                      {{ getOrderStatusLabel(order.status) }}
                    </app-admin-badge>
                  </td>
                  <td style="text-align: right;">
                    <div class="admin-table__actions" style="justify-content: flex-end; gap: 8px;">
                      @if (order.status === 'en_attente') {
                        <button type="button" class="admin-btn admin-btn--sm admin-btn--primary" (click)="confirmOrder(order.id)">
                          Confirmer
                        </button>
                      }
                      <select
                        class="admin-order-status-select"
                        [value]="order.status"
                        (change)="onStatusChange(order.id, $event)"
                      >
                        <option value="en_attente">En attente</option>
                        <option value="en_cours">En cours</option>
                        <option value="livre">Marquer Livrée</option>
                        <option value="annule">Annuler</option>
                      </select>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="admin-table__empty">Aucune commande trouvée.</td></tr>
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

      <!-- Modal création commande admin -->
      <app-admin-modal title="Nouvelle commande client" [isOpen]="isCreateOpen()" (close)="closeCreateModal()">
        <form class="admin-form" (ngSubmit)="submitCreate()">
          @if (createError()) {
            <div class="admin-form-alert admin-form-alert--danger"><span>{{ createError() }}</span></div>
          }
          <div class="admin-form__row">
            <div class="admin-form__field">
              <label>Nom du client *</label>
              <input type="text" [(ngModel)]="cName" name="cName" required placeholder="Ex : Awa Ndiaye" />
            </div>
            <div class="admin-form__field">
              <label>Téléphone *</label>
              <input type="text" [(ngModel)]="cPhone" name="cPhone" required placeholder="+221 77 000 00 00" />
            </div>
          </div>
          <div class="admin-form__row">
            <div class="admin-form__field">
              <label>Adresse de livraison</label>
              <input type="text" [(ngModel)]="cAddress" name="cAddress" placeholder="Quartier, rue, repère" />
            </div>
            <div class="admin-form__field">
              <label>Quartier</label>
              <input type="text" [(ngModel)]="cDistrict" name="cDistrict" placeholder="Ex : Ouakam" />
            </div>
          </div>

          <div class="admin-form__field">
            <label>Articles *</label>
            @for (line of draftLines(); track $index) {
              <div style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
                <select [ngModel]="line.productId" (ngModelChange)="setLineProduct($index, $event)" [ngModelOptions]="{ standalone: true }" style="flex:1;">
                  <option value="">— Choisir un produit —</option>
                  @for (p of data.products(); track p.id) {
                    <option [value]="p.id">{{ p.title }} ({{ formatPrice(p.price) }})</option>
                  }
                </select>
                <input type="number" min="1" [ngModel]="line.quantity" (ngModelChange)="setLineQty($index, $event)" [ngModelOptions]="{ standalone: true }" style="width:70px;" />
                <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="removeLine($index)" aria-label="Retirer">✕</button>
              </div>
            }
            <button type="button" class="admin-btn admin-btn--sm" (click)="addLine()">+ Ajouter un article</button>
          </div>

          <div class="admin-form__field">
            <label>Statut initial</label>
            <select [(ngModel)]="cStatus" name="cStatus">
              <option value="EN_COURS">Confirmée (en cours)</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
          </div>
        </form>

        <div footer-actions>
          <button type="button" class="admin-btn admin-btn--primary" [disabled]="creating()" (click)="submitCreate()">
            {{ creating() ? 'Enregistrement…' : 'Enregistrer la commande' }}
          </button>
        </div>
      </app-admin-modal>

      @if (toast()) {
        <div class="admin-toast-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{{ toast() }}</span>
        </div>
      }
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
  protected readonly toast = signal<string | null>(null);

  // ── Création admin ──
  protected readonly isCreateOpen = signal(false);
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly draftLines = signal<DraftLine[]>([{ productId: '', quantity: 1 }]);
  protected cName = '';
  protected cPhone = '';
  protected cAddress = '';
  protected cDistrict = '';
  protected cStatus: 'EN_COURS' | 'EN_ATTENTE' = 'EN_COURS';

  protected readonly filteredOrders = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const st = this.statusFilter;
    return this.data.orders().filter(o => {
      const matchQ = !q || o.orderNumber.toLowerCase().includes(q) || (o.customerName || '').toLowerCase().includes(q) || (o.customerPhone || '').includes(q);
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
      case 'en_cours': return 'primary';
      case 'en_attente': return 'warning';
      case 'annule': return 'danger';
      default: return 'neutral';
    }
  }

  protected getOrderStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'livre': return 'Livrée';
      case 'en_cours': return 'En cours';
      case 'en_attente': return 'En attente';
      case 'annule': return 'Annulée';
      default: return status;
    }
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 3000);
  }

  protected confirmOrder(orderId: string): void {
    this.data.confirmOrder(orderId).subscribe({
      next: () => this.showToast('Commande confirmée (en préparation).'),
      error: () => alert('Impossible de confirmer la commande.')
    });
  }

  protected async onStatusChange(orderId: string, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as OrderStatus;
    const order = this.data.orders().find(o => o.id === orderId);

    if (newStatus === 'annule') {
      const confirmed = await this.confirmService.confirm({
        title: 'Annulation de Commande',
        message: 'Êtes-vous sûr de vouloir annuler cette commande client ?',
        confirmLabel: 'Confirmer l\'annulation',
        variant: 'danger'
      });
      if (!confirmed) {
        if (order) select.value = order.status;
        return;
      }
    }

    this.data.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => this.showToast('Statut mis à jour.'),
      error: () => {
        alert('Impossible de mettre à jour le statut. Réessayez.');
        if (order) select.value = order.status;
      }
    });
  }

  // ── Modal création ──
  protected openCreateModal(): void {
    this.cName = '';
    this.cPhone = '';
    this.cAddress = '';
    this.cDistrict = '';
    this.cStatus = 'EN_COURS';
    this.draftLines.set([{ productId: '', quantity: 1 }]);
    this.createError.set(null);
    this.isCreateOpen.set(true);
  }

  protected closeCreateModal(): void {
    if (!this.creating()) this.isCreateOpen.set(false);
  }

  protected addLine(): void {
    this.draftLines.update(l => [...l, { productId: '', quantity: 1 }]);
  }

  protected removeLine(i: number): void {
    this.draftLines.update(l => l.filter((_, idx) => idx !== i));
  }

  protected setLineProduct(i: number, productId: string): void {
    this.draftLines.update(l => l.map((line, idx) => (idx === i ? { ...line, productId } : line)));
  }

  protected setLineQty(i: number, qty: number): void {
    this.draftLines.update(l => l.map((line, idx) => (idx === i ? { ...line, quantity: Math.max(1, Number(qty) || 1) } : line)));
  }

  protected submitCreate(): void {
    if (this.creating()) return;
    const items = this.draftLines()
      .filter(l => l.productId && !isNaN(Number(l.productId)))
      .map(l => ({ productId: Number(l.productId), quantity: Math.max(1, l.quantity) }));

    if (!this.cName.trim() || !this.cPhone.trim()) {
      this.createError.set('Le nom et le téléphone du client sont obligatoires.');
      return;
    }
    if (items.length === 0) {
      this.createError.set('Ajoutez au moins un article valide.');
      return;
    }

    this.creating.set(true);
    this.createError.set(null);
    this.data.adminCreateOrder({
      items,
      customerName: this.cName.trim(),
      customerPhone: this.cPhone.trim(),
      deliveryAddress: this.cAddress.trim() || undefined,
      deliveryDistrict: this.cDistrict.trim() || undefined,
      status: this.cStatus
    }).subscribe({
      next: () => {
        this.creating.set(false);
        this.isCreateOpen.set(false);
        this.showToast('Commande enregistrée avec succès.');
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(err?.error?.error || 'Impossible d\'enregistrer la commande.');
      }
    });
  }
}
