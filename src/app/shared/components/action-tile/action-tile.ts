import { Component, Input } from '@angular/core';
import { SalonAction } from '../../models/salon';

@Component({
  selector: 'app-action-tile',
  template: `
    <a class="action-tile" [href]="action.href || '#'">
      <span class="action-tile__icon" aria-hidden="true">
        @switch (action.icon) {
          @case ('globe') {
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
            </svg>
          }
          @case ('phone') {
            <svg viewBox="0 0 24 24">
              <path d="M22 16.9v2.8a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.7 19.7 0 0 1 2.1 4 2 2 0 0 1 4.1 2h2.8a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.1-1.1a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 1.8Z" />
              <path d="M15 5c2.1.4 3.6 1.9 4 4M15 1c4.3.5 7.5 3.8 8 8" />
            </svg>
          }
          @case ('navigation') {
            <svg viewBox="0 0 24 24">
              <path d="M21 3 10 14" />
              <path d="m21 3-7 18-4-7-7-4 18-7Z" />
            </svg>
          }
          @case ('share') {
            <svg viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
            </svg>
          }
        }
      </span>
      <span>{{ action.label }}</span>
    </a>
  `,
  styleUrl: './action-tile.scss'
})
export class ActionTile {
  @Input({ required: true }) action!: SalonAction;
}
