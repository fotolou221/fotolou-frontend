import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService, PlatformSettings } from '../../services/admin-data.service';
import { AdminConfirmService } from '../../services/admin-confirm.service';

@Component({
  selector: 'app-admin-settings-page',
  imports: [FormsModule],
  template: `
    <div class="admin-page">
      
      <!-- Page Header -->
      <div class="admin-page__header">
        <div>
          <h1>Paramètres de la Plateforme</h1>
          <p>Configurez les informations globales, coordonnées de support et règles métier de Fotolou.</p>
        </div>
        <button type="button" class="admin-btn admin-btn--primary" (click)="saveSettings()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Enregistrer les paramètres</span>
        </button>
      </div>

      <!-- Success Toast -->
      @if (savedToast()) {
        <div class="admin-toast-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 18px; height: 18px;"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Paramètres enregistrés avec succès !</span>
        </div>
      }

      <!-- Settings Cards Grid -->
      <div class="admin-settings-grid">
        
        <!-- Card 1: Coordonnées & Support -->
        <div class="admin-card">
          <div class="admin-card__title">
            <h3>Informations Générales &amp; Support</h3>
            <p>Coordonnées affichées sur le site vitrine et l'application mobile.</p>
          </div>

          <div class="admin-form">
            <div class="admin-form__field">
              <label>Nom de l'application</label>
              <input type="text" [(ngModel)]="form.appName" name="appName" />
            </div>

            <div class="admin-form__field">
              <label>E-mail de contact support</label>
              <input type="email" [(ngModel)]="form.contactEmail" name="contactEmail" />
            </div>

            <div class="admin-form__field">
              <label>Téléphone &amp; WhatsApp Support</label>
              <input type="text" [(ngModel)]="form.contactPhone" name="contactPhone" />
            </div>
          </div>
        </div>

        <!-- Card 2: Horaires & Commission -->
        <div class="admin-card">
          <div class="admin-card__title">
            <h3>Règles Métier &amp; Horaires</h3>
            <p>Paramètres opérationnels par défaut.</p>
          </div>

          <div class="admin-form">
            <div class="admin-form__row">
              <div class="admin-form__field">
                <label>Ouverture par défaut</label>
                <input type="time" [(ngModel)]="form.openingTime" name="openingTime" />
              </div>
              <div class="admin-form__field">
                <label>Fermeture par défaut</label>
                <input type="time" [(ngModel)]="form.closingTime" name="closingTime" />
              </div>
            </div>

            <div class="admin-form__field">
              <label>Taux de commission plateforme (%)</label>
              <input type="number" [(ngModel)]="form.commissionRate" name="commissionRate" min="0" max="50" />
            </div>

            <div class="admin-toggle-field">
              <div>
                <strong>Réservation pour proches</strong>
                <span>Permettre aux clients de prendre un ticket pour un tiers</span>
              </div>
              <input type="checkbox" [(ngModel)]="form.allowRelativeBooking" name="allowRelativeBooking" />
            </div>

            <div class="admin-toggle-field admin-toggle-field--warning">
              <div>
                <strong>Mode Maintenance</strong>
                <span>Suspendre temporairement l'émission de nouveaux tickets</span>
              </div>
              <input type="checkbox" [(ngModel)]="form.maintenanceMode" name="maintenanceMode" />
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styleUrl: './admin-settings-page.scss'
})
export class AdminSettingsPage {
  private readonly data = inject(AdminDataService);
  private readonly confirmService = inject(AdminConfirmService);

  protected form: PlatformSettings = { ...this.data.settings() };
  protected readonly savedToast = signal<boolean>(false);

  protected async saveSettings(): Promise<void> {
    if (this.form.maintenanceMode && !this.data.settings().maintenanceMode) {
      const confirmed = await this.confirmService.confirm({
        title: 'Activation du Mode Maintenance',
        message: 'Êtes-vous sûr de vouloir activer le mode maintenance ? Tous les salons seront temporairement indisponibles pour la prise de ticket.',
        confirmLabel: 'Activer la maintenance',
        variant: 'warning'
      });
      if (!confirmed) {
        this.form.maintenanceMode = false;
        return;
      }
    }
    this.data.updateSettings(this.form);
    this.savedToast.set(true);
    setTimeout(() => this.savedToast.set(false), 3000);
  }
}
