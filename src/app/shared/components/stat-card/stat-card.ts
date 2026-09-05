import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <article class="stat-card">
      <span class="stat-card__label">{{ label }}</span>
      <div class="stat-card__content">
        <ng-content />
      </div>
    </article>
  `,
  styleUrl: './stat-card.scss'
})
export class StatCard {
  @Input({ required: true }) label = '';
}
