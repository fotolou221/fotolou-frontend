import { Component, Input } from '@angular/core';
import { Salon } from '../../models/salon';

@Component({
  selector: 'app-status-badge',
  template: `<span class="status-badge" [class.status-badge--closed]="status === 'closed'">{{ label }}</span>`,
  styleUrl: './status-badge.scss'
})
export class StatusBadge {
  @Input({ required: true }) status!: Salon['status'];

  protected get label(): string {
    return this.status === 'open' ? 'Ouvert' : 'Fermé';
  }
}
