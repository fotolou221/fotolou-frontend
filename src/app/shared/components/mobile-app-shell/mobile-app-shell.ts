import { Component, Input } from '@angular/core';
import { ClientLayout } from '../client-layout/client-layout';
import { BottomNavItem } from '../bottom-navigation/bottom-navigation';

@Component({
  selector: 'app-mobile-app-shell',
  imports: [ClientLayout],
  template: `
    <app-client-layout
      [activeNav]="activeNav"
      [showBottomNav]="showBottomNav"
      [bleedHeader]="bleedTop"
      [hasHeaderSlot]="hasHeader"
      [hasCustomFooter]="hasCustomFooter"
    >
      <ng-content select="[slot=header], [header]" header />
      <ng-content />
      <ng-content select="[slot=footer], [footer]" footer />
    </app-client-layout>
  `
})
export class MobileAppShell {
  @Input() activeNav: BottomNavItem = 'home';
  @Input() bleedTop = false;
  @Input() showBottomNav = true;
  @Input() hasHeader = true;
  @Input() hasCustomFooter = false;
}
