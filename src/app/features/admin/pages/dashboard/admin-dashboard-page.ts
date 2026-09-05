import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../../services/admin-data.service';
import { AdminStatCard } from '../../components/admin-stat-card/admin-stat-card';
import { AdminBadge } from '../../components/admin-badge/admin-badge';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink, AdminStatCard, AdminBadge],
  template: `
    <div class="admin-page">
      
      <!-- Page Header -->
      <div class="admin-page__header">
        <div>
          <h1>Tableau de Bord Général</h1>
          <p>Vue d'ensemble en temps réel de l'activité Fotolou à Dakar.</p>
        </div>
        <div class="admin-page__header-actions">
          <a routerLink="/admin/salons" class="admin-btn admin-btn--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Ajouter un Salon</span>
          </a>
        </div>
      </div>

      <!-- 4 Stat Cards Row -->
      <div class="admin-grid-stats">
        <app-admin-stat-card
          label="Salons Partenaires"
          [value]="data.stats().totalSalons"
          [subtext]="data.stats().openSalons + ' salons actuellement ouverts'"
          trend="+8%"
          [trendUp]="true"
        >
          <div icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
        </app-admin-stat-card>

        <app-admin-stat-card
          label="Tickets en Cours"
          [value]="data.stats().activeTickets"
          [subtext]="data.stats().servedTickets + ' clients servis ce jour'"
          trend="+15%"
          [trendUp]="true"
          [isAccent]="true"
        >
          <div icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>
          </div>
        </app-admin-stat-card>

        <app-admin-stat-card
          label="Ventes Boutique"
          [value]="formatPrice(data.stats().totalRevenue)"
          [subtext]="data.stats().totalOrders + ' commandes passées'"
          trend="+12%"
          [trendUp]="true"
        >
          <div icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
        </app-admin-stat-card>

        <app-admin-stat-card
          label="Clients Enregistrés"
          [value]="data.stats().totalClients"
          subtext="Utilisateurs mobiles actifs"
          trend="+24%"
          [trendUp]="true"
        >
          <div icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </app-admin-stat-card>
      </div>

      <!-- Main Dashboard 2-Columns Grid -->
      <div class="admin-dashboard-grid">
        
        <!-- Left: Real-time Live Salons Queues -->
        <div class="admin-card">
          <div class="admin-card__header">
            <div class="admin-card__header-title">
              <h3>Affluence en Direct dans les Salons</h3>
              <span>Surveillance des files d'attente à Dakar</span>
            </div>
            <a routerLink="/admin/tickets" class="admin-card__link">Voir tous les tickets &rarr;</a>
          </div>

          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Salon</th>
                  <th>Quartier</th>
                  <th>Statut</th>
                  <th>En attente</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (salon of data.salons(); track salon.id) {
                  <tr>
                    <td>
                      <div class="admin-table__item-with-img">
                        <img [src]="salon.avatarUrl || salon.coverUrl" [alt]="salon.name" class="admin-table__thumb" />
                        <strong>{{ salon.name }}</strong>
                      </div>
                    </td>
                    <td>{{ salon.district || salon.location }}</td>
                    <td>
                      <app-admin-badge [variant]="salon.status === 'open' ? 'success' : 'danger'">
                        {{ salon.status === 'open' ? 'Ouvert' : 'Fermé' }}
                      </app-admin-badge>
                    </td>
                    <td>
                      <strong class="admin-table__count-pill">{{ salon.peopleWaiting }} pers.</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="admin-table__action-btn"
                        (click)="data.toggleSalonStatus(salon.id)"
                      >
                        {{ salon.status === 'open' ? 'Fermer' : 'Ouvrir' }}
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="admin-table__empty-cell">
                      Aucun salon partenaire enregistré pour le moment.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right: Recent Activity Feed & Orders -->
        <div class="admin-card">
          <div class="admin-card__header">
            <div class="admin-card__header-title">
              <h3>Dernières Commandes Boutique</h3>
              <span>Achats récents sur la boutique</span>
            </div>
            <a routerLink="/admin/commandes" class="admin-card__link">Gérer &rarr;</a>
          </div>

          <div class="admin-orders-list">
            @for (order of data.orders(); track order.id) {
              <div class="admin-order-item">
                <div class="admin-order-item__left">
                  <div class="admin-order-item__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <div class="admin-order-item__details">
                    <strong>{{ order.orderNumber }}</strong>
                    <span>{{ order.items.length }} article(s) &bull; {{ formatPrice(order.totalPrice) }}</span>
                  </div>
                </div>
                <app-admin-badge [variant]="order.status === 'livre' ? 'success' : 'warning'">
                  {{ order.status === 'livre' ? 'Livrée' : 'En cours' }}
                </app-admin-badge>
              </div>
            } @empty {
              <div class="admin-orders-list__empty">
                Aucune commande boutique enregistrée.
              </div>
            }
          </div>

          <div class="admin-card__quick-shortcuts">
            <h4>Raccourcis rapides</h4>
            <div class="admin-card__shortcuts-grid">
              <a routerLink="/admin/salons" class="admin-shortcut-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Gérer les Salons</span>
              </a>
              <a routerLink="/admin/utilisateurs" class="admin-shortcut-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Utilisateurs &amp; Profils</span>
              </a>
              <a routerLink="/admin/boutique" class="admin-shortcut-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span>Produits Boutique</span>
              </a>
              <a routerLink="/admin/categories" class="admin-shortcut-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><circle cx="6.5" cy="17.5" r="3.5"/></svg>
                <span>Catégories</span>
              </a>
              <a routerLink="/admin/settings" class="admin-shortcut-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Configuration</span>
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styleUrl: './admin-dashboard-page.scss'
})
export class AdminDashboardPage implements OnInit {
  protected readonly data = inject(AdminDataService);

  ngOnInit(): void {
    this.data.loadFromBackend();
  }

  protected formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }
}
