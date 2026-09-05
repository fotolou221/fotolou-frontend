import { Component, inject } from '@angular/core';
import { AdminConfirmService } from '../../services/admin-confirm.service';

@Component({
  selector: 'app-admin-confirm-dialog',
  template: `
    @if (confirmService.state().isOpen) {
      <div
        class="confirm-backdrop"
        (click)="confirmService.handleCancel()"
        (keydown.escape)="confirmService.handleCancel()"
        tabindex="-1"
      >
        <div class="confirm-dialog" (click)="$event.stopPropagation()">
          <div class="confirm-dialog__header">
            <div
              class="confirm-dialog__icon-wrap"
              [class]="'confirm-dialog__icon-wrap--' + confirmService.state().variant"
            >
              @switch (confirmService.state().variant) {
                @case ('danger') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                }
                @case ('warning') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                }
                @default {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                }
              }
            </div>

            <div class="confirm-dialog__text">
              <h3>{{ confirmService.state().title }}</h3>
              <p>{{ confirmService.state().message }}</p>
            </div>
          </div>

          <footer class="confirm-dialog__actions">
            <button
              type="button"
              class="confirm-dialog__btn confirm-dialog__btn--cancel"
              (click)="confirmService.handleCancel()"
            >
              {{ confirmService.state().cancelLabel }}
            </button>

            <button
              type="button"
              class="confirm-dialog__btn"
              [class]="'confirm-dialog__btn--' + confirmService.state().variant"
              (click)="confirmService.handleConfirm()"
            >
              {{ confirmService.state().confirmLabel }}
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styleUrl: './admin-confirm-dialog.scss'
})
export class AdminConfirmDialogComponent {
  protected readonly confirmService = inject(AdminConfirmService);
}
