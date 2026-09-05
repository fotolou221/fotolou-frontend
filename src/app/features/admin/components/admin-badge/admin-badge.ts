import { Component, Input } from '@angular/core';

export type AdminBadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary';

@Component({
  selector: 'app-admin-badge',
  template: `
    <span class="admin-badge admin-badge--{{ variant }}">
      <span class="admin-badge__dot"></span>
      <ng-content />
    </span>
  `,
  styleUrl: './admin-badge.scss'
})
export class AdminBadge {
  @Input() variant: AdminBadgeVariant = 'neutral';
}
