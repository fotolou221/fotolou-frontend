import { Component, Input } from '@angular/core';
import { BottomNavigation, BottomNavItem, UserRole } from '../bottom-navigation/bottom-navigation';

@Component({
  selector: 'app-client-layout',
  imports: [BottomNavigation],
  template: `
    <div
      class="client-layout"
      [class.client-layout--bleed-header]="bleedHeader"
      [class.client-layout--with-bottom-nav]="showBottomNav"
    >
      <!-- Fixed/Sticky Header Slot -->
      @if (hasHeaderSlot) {
        <header class="client-layout__header">
          <div class="client-layout__header-inner">
            <ng-content select="[slot=header], [header]" />
          </div>
        </header>
      }

      <!-- Main Body Container -->
      <main class="client-layout__body">
        <div class="client-layout__main-content">
          <ng-content />
        </div>
      </main>

      <!-- Bottom Navigation or Fixed Action Footer -->
      @if (showBottomNav || hasCustomFooter) {
        <footer class="client-layout__footer">
          <ng-content select="[slot=footer], [footer]" />

          @if (showBottomNav) {
            <app-bottom-navigation [activeItem]="activeNav" [role]="role" />
          }
        </footer>
      }
    </div>
  `,
  styleUrl: './client-layout.scss'
})
export class ClientLayout {
  @Input() activeNav: BottomNavItem = 'home';
  @Input() role?: UserRole;
  @Input() showBottomNav = true;
  @Input() bleedHeader = false;
  @Input() hasHeaderSlot = true;
  @Input() hasCustomFooter = false;
}
