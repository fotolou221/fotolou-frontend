import { Component, Input, Output, EventEmitter } from '@angular/core';

export type AdminViewMode = 'table' | 'grid';

@Component({
  selector: 'app-admin-view-toggle',
  template: `
    <div class="admin-view-toggle" role="group" aria-label="Mode d'affichage">
      <button
        type="button"
        class="admin-view-toggle__btn"
        [class.active]="viewMode === 'table'"
        (click)="setView('table')"
        title="Affichage en liste / tableau"
        aria-label="Affichage en liste"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span>Liste</span>
      </button>

      <button
        type="button"
        class="admin-view-toggle__btn"
        [class.active]="viewMode === 'grid'"
        (click)="setView('grid')"
        title="Affichage en grille"
        aria-label="Affichage en grille"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Grille</span>
      </button>
    </div>
  `,
  styleUrl: './admin-view-toggle.scss'
})
export class AdminViewToggle {
  @Input() viewMode: AdminViewMode = 'table';
  @Output() viewModeChange = new EventEmitter<AdminViewMode>();

  protected setView(mode: AdminViewMode): void {
    if (this.viewMode !== mode) {
      this.viewMode = mode;
      this.viewModeChange.emit(mode);
    }
  }
}
