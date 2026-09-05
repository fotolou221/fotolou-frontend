import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService, AdminClientUser } from '../../services/admin-data.service';
import { AdminBadge } from '../../components/admin-badge/admin-badge';
import { AdminPagination } from '../../components/admin-pagination/admin-pagination';
import { AdminModal } from '../../components/admin-modal/admin-modal';
import { AdminImageUploader } from '../../components/admin-image-uploader/admin-image-uploader';
import { AdminConfirmService } from '../../services/admin-confirm.service';

@Component({
  selector: 'app-admin-users-page',
  imports: [FormsModule, AdminBadge, AdminPagination, AdminModal, AdminImageUploader],
  template: `
    <div class="admin-page">
      
      <!-- Page Header -->
      <div class="admin-page__header">
        <div>
          <h1>Utilisateurs &amp; Profils</h1>
          <p>Consultez et administrez la base des utilisateurs (Clients, Coiffeurs, Administrateurs) de la plateforme Fotolou.</p>
        </div>
        <button type="button" class="admin-btn admin-btn--primary" (click)="openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      <!-- Filter Toolbar -->
      <div class="admin-toolbar">
        <div class="admin-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="currentPage.set(1)"
            placeholder="Rechercher par nom, téléphone ou quartier..."
          />
        </div>

        <div class="admin-filter-group">
          <select [(ngModel)]="roleFilter" (ngModelChange)="currentPage.set(1)" class="admin-select">
            <option value="all">Tous les profils</option>
            <option value="client">Clients uniquement</option>
            <option value="coiffeur">Coiffeurs partenaires</option>
            <option value="admin">Administrateurs</option>
          </select>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="admin-card">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Utilisateur / Photo</th>
                <th>Type de Profil</th>
                <th>Téléphone</th>
                <th>Quartier / Ville</th>
                <th>Tickets pris (Clients)</th>
                <th>Proches enregistrés</th>
                <th>Inscrit depuis</th>
                <th>Statut</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of paginatedUsers(); track user.id) {
                <tr>
                  <td>
                    <div class="admin-table__item-with-avatar">
                      @if (user.avatarUrl) {
                        <img
                          class="admin-user-avatar-img"
                          [src]="user.avatarUrl"
                          [alt]="user.name"
                          (error)="user.avatarUrl = ''"
                        />
                      } @else {
                        <div class="admin-user-avatar">
                          {{ user.name.substring(0, 2).toUpperCase() }}
                        </div>
                      }
                      <div>
                        <strong>{{ user.name }}</strong>
                        <div style="font-size: 0.75rem; color: #64748b;">ID: {{ user.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    @if (user.role === 'admin') {
                      <app-admin-badge variant="danger">Super Admin</app-admin-badge>
                    } @else if (user.role === 'coiffeur') {
                      <app-admin-badge variant="info">Coiffeur Pro</app-admin-badge>
                    } @else {
                      <app-admin-badge variant="neutral">Client</app-admin-badge>
                    }
                  </td>
                  <td><strong>{{ user.phone }}</strong></td>
                  <td>{{ user.district }}</td>
                  <td>
                    @if (user.role === 'client') {
                      <strong>{{ user.ticketsCount }}</strong> ticket(s)
                    } @else {
                      <span style="color: #94a3b8; font-size: 0.8125rem;">—</span>
                    }
                  </td>
                  <td>
                    @if (user.role === 'client') {
                      <span class="admin-badge admin-badge--neutral">
                        {{ user.relativesCount }} proche(s)
                      </span>
                    } @else {
                      <span style="color: #94a3b8; font-size: 0.8125rem;">—</span>
                    }
                  </td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <app-admin-badge variant="success">Actif</app-admin-badge>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 8px;">
                      <button type="button" class="admin-icon-btn" (click)="openEditModal(user)" title="Modifier">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      </button>
                      <button type="button" class="admin-icon-btn admin-icon-btn--danger" (click)="deleteUser(user)" title="Supprimer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="admin-table__empty">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <app-admin-pagination
          [totalItems]="filteredUsers().length"
          [pageSize]="pageSize()"
          [currentPage]="currentPage()"
          (pageChange)="currentPage.set($event)"
          (pageSizeChange)="pageSize.set($event)"
        />
      </div>

      <!-- Add / Edit User Modal -->
      <app-admin-modal
        [title]="editingUser() ? 'Modifier le Profil Utilisateur' : 'Créer un Nouvel Utilisateur'"
        [isOpen]="isModalOpen()"
        (close)="closeModal()"
        [showFooter]="false"
      >
        <form class="admin-form" (ngSubmit)="saveUser()">
          <div class="step-title-box" style="margin-bottom: 16px;">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 4px;">
              {{ editingUser() ? 'Mettre à jour les informations' : 'Informations du nouvel utilisateur' }}
            </h3>
            <p style="font-size: 0.8125rem; color: #64748b; margin: 0;">
              Renseignez l'identité, le numéro de téléphone et le rôle attribué sur Fotolou.
            </p>
          </div>

          <app-admin-image-uploader
            label="Photo de profil / Avatar de l'utilisateur"
            [(imageUrl)]="formAvatarUrl"
          />

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label>Nom complet *</label>
              <input type="text" [(ngModel)]="formName" name="name" required placeholder="Ex: Awa Diop" />
            </div>

            <div class="admin-form-group">
              <label>Numéro de téléphone *</label>
              <input type="tel" [(ngModel)]="formPhone" name="phone" required placeholder="+221 77 123 45 67" />
            </div>
          </div>

          <div class="admin-form-row">
            <div class="admin-form-group">
              <label>Quartier / Ville *</label>
              <input type="text" [(ngModel)]="formDistrict" name="district" required placeholder="Ex: Mermoz, Dakar" />
            </div>

            <div class="admin-form-group">
              <label>Rôle sur la plateforme *</label>
              <select [(ngModel)]="formRole" name="role" class="admin-select" style="width: 100%; height: 42px; border-radius: 10px; padding: 0 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                <option value="client">Client (Utilisateur classique)</option>
                <option value="coiffeur">Coiffeur (Partenaire Salon)</option>
                <option value="admin">Administrateur (Console Admin)</option>
              </select>
            </div>
          </div>

          <div class="admin-modal-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <button type="button" class="admin-btn admin-btn--outline" (click)="closeModal()">
              Annuler
            </button>
            <button type="submit" class="admin-btn admin-btn--primary">
              @if (editingUser()) {
                Enregistrer les modifications
              } @else {
                Créer l'utilisateur
              }
            </button>
          </div>
        </form>
      </app-admin-modal>

    </div>
  `,
  styleUrl: './admin-users-page.scss'
})
export class AdminUsersPage implements OnInit {
  protected readonly data = inject(AdminDataService);
  private readonly confirmService = inject(AdminConfirmService);

  protected searchQuery = '';
  protected roleFilter = 'all';

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly isModalOpen = signal(false);
  protected readonly editingUser = signal<AdminClientUser | null>(null);

  protected formName = '';
  protected formPhone = '';
  protected formDistrict = '';
  protected formAvatarUrl = '';
  protected formRole: 'client' | 'coiffeur' | 'admin' = 'client';

  ngOnInit(): void {
    this.data.loadUsers();
  }

  protected readonly filteredUsers = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const role = this.roleFilter;

    return this.data.clients().filter(u => {
      const matchRole = role === 'all' || (u.role || 'client') === role;
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.district.toLowerCase().includes(q);

      return matchRole && matchQuery;
    });
  });

  protected readonly paginatedUsers = computed(() => {
    const list = this.filteredUsers();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  protected formatDate(dateStr: string): string {
    if (!dateStr) return 'Récemment';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  protected openAddModal(): void {
    this.editingUser.set(null);
    this.formName = '';
    this.formPhone = '+221 77 ';
    this.formDistrict = 'Dakar';
    this.formAvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    this.formRole = 'client';
    this.isModalOpen.set(true);
  }

  protected openEditModal(user: AdminClientUser): void {
    this.editingUser.set(user);
    this.formName = user.name;
    this.formPhone = user.phone;
    this.formDistrict = user.district;
    this.formAvatarUrl = user.avatarUrl || '';
    this.formRole = (user.role as any) || 'client';
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  protected saveUser(): void {
    if (!this.formName.trim() || !this.formPhone.trim()) return;

    const existing = this.editingUser();
    if (existing) {
      this.data.updateUser(existing.id, {
        name: this.formName.trim(),
        phone: this.formPhone.trim(),
        district: this.formDistrict.trim(),
        avatarUrl: this.formAvatarUrl.trim() || undefined,
        role: this.formRole
      }, existing.phone);
    } else {
      const newUser: AdminClientUser = {
        id: `u-${Date.now()}`,
        name: this.formName.trim(),
        phone: this.formPhone.trim(),
        district: this.formDistrict.trim(),
        avatarUrl: this.formAvatarUrl.trim() || undefined,
        role: this.formRole,
        ticketsCount: 0,
        relativesCount: 0,
        createdAt: new Date().toISOString()
      };
      this.data.addUser(newUser);
    }

    this.closeModal();
  }

  protected async deleteUser(user: AdminClientUser): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Suppression Utilisateur',
      message: `Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${user.name}" (${user.phone}) ? Toutes ses données seront effacées.`,
      confirmLabel: 'Supprimer l\'utilisateur',
      variant: 'danger'
    });
    if (confirmed) {
      this.data.deleteUser(user.id, user.phone);
    }
  }
}
