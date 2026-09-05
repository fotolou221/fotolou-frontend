import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InstallBanner } from './shared/components/install-banner/install-banner';
import { DesktopRestriction } from './shared/components/desktop-restriction/desktop-restriction';
import { RealtimeSyncService } from './shared/services/realtime-sync.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InstallBanner, DesktopRestriction],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // Injected eagerly to establish the real-time SSE stream across the entire app
  private readonly realtimeSync = inject(RealtimeSyncService);
}

