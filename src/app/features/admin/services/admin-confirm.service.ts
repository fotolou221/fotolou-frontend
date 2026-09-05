import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class AdminConfirmService {
  readonly state = signal<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    variant: 'primary'
  });

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmer',
        cancelLabel: options.cancelLabel ?? 'Annuler',
        variant: options.variant ?? 'primary',
        resolve
      });
    });
  }

  handleConfirm(): void {
    const s = this.state();
    s.resolve?.(true);
    this.close();
  }

  handleCancel(): void {
    const s = this.state();
    s.resolve?.(false);
    this.close();
  }

  private close(): void {
    this.state.update((prev) => ({
      ...prev,
      isOpen: false,
      resolve: undefined
    }));
  }
}
