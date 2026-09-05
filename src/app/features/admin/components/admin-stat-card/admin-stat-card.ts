import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-stat-card',
  template: `
    <div class="admin-stat-card" [class.admin-stat-card--accent]="isAccent">
      <div class="admin-stat-card__header">
        <div class="admin-stat-card__icon-wrap">
          <ng-content select="[icon]" />
        </div>
        @if (trend) {
          <span class="admin-stat-card__trend" [class.admin-stat-card__trend--up]="trendUp" [class.admin-stat-card__trend--down]="!trendUp">
            {{ trendUp ? '↑' : '↓' }} {{ trend }}
          </span>
        }
      </div>

      <div class="admin-stat-card__body">
        <span class="admin-stat-card__label">{{ label }}</span>
        <strong class="admin-stat-card__value">{{ value }}</strong>
        @if (subtext) {
          <span class="admin-stat-card__subtext">{{ subtext }}</span>
        }
      </div>
    </div>
  `,
  styleUrl: './admin-stat-card.scss'
})
export class AdminStatCard {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: string | number = '';
  @Input() subtext?: string;
  @Input() trend?: string;
  @Input() trendUp = true;
  @Input() isAccent = false;
}
