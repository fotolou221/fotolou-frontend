import { Injectable, signal, computed, inject, PLATFORM_ID, OnDestroy, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';
import type { UnrecoverableStateEvent, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { filter, fromEvent, interval, merge, Subject, takeUntil } from 'rxjs';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type PwaPlatform = 'ios' | 'android' | 'desktop' | 'other';

@Injectable({
  providedIn: 'root'
})
export class PwaService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly ngZone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ── Reactive State ──────────────────────────────────────────
  readonly isStandalone = signal<boolean>(false);
  readonly platform = signal<PwaPlatform>('other');
  readonly isMobile = signal<boolean>(false);
  readonly canPromptNative = signal<boolean>(false);
  readonly showBanner = signal<boolean>(false);
  readonly updateAvailable = signal<boolean>(false);
  readonly updateInProgress = signal<boolean>(false);
  readonly updateError = signal<string | null>(null);

  // ── Derived State ───────────────────────────────────────────
  readonly isInstalled = computed(() => this.isStandalone());
  readonly isIos = computed(() => this.platform() === 'ios');
  readonly isAndroid = computed(() => this.platform() === 'android');
  readonly isInstallable = computed(() => !this.isStandalone());

  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private standaloneMediaQueryList: MediaQueryList | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly UPDATE_CHECK_INTERVAL_MS = 60 * 1000;
  private readonly UPDATE_CHECK_THROTTLE_MS = 10 * 1000;
  private readonly UPDATE_RELOAD_VERSION_KEY = 'fotolou_pwa_update_reload_version';
  private readonly UNRECOVERABLE_RELOAD_KEY = 'fotolou_pwa_unrecoverable_reload';
  private lastUpdateCheckAt = 0;
  private isActivatingUpdate = false;

  constructor() {
    if (!this.isBrowser) return;

    this.detectPlatform();
    this.detectStandaloneMode();
    this.setupListeners();
    this.setupUpdateManagement();
    this.evaluateBannerVisibility();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (!this.isBrowser) return;
    this.cleanupListeners();
  }

  // ── Platform Detection ──────────────────────────────────────
  private detectPlatform(): void {
    if (!this.isBrowser) return;

    const ua = navigator.userAgent || navigator.vendor || '';
    const platform = (navigator as unknown as { userAgentData?: { platform?: string }; platform?: string }).platform || '';

    // iOS Detection (iPhone, iPad, iPod, including iPadOS with desktop UA)
    const isIosDevice =
      /iphone|ipad|ipod/i.test(ua) ||
      (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Android Detection
    const isAndroidDevice = /android/i.test(ua);

    // Mobile check
    const isMobileDevice = Boolean(
      isIosDevice ||
      isAndroidDevice ||
      /mobile|touch|tablet|silk|kindle/i.test(ua) ||
      (window.matchMedia && window.matchMedia('(max-width: 768px)')?.matches)
    );

    if (isIosDevice) {
      this.platform.set('ios');
    } else if (isAndroidDevice) {
      this.platform.set('android');
    } else if (!isMobileDevice) {
      this.platform.set('desktop');
    } else {
      this.platform.set('other');
    }

    this.isMobile.set(isMobileDevice);
  }

  // ── Standalone Mode Detection ───────────────────────────────
  private detectStandaloneMode(): void {
    if (!this.isBrowser) return;

    // Check display-mode: standalone
    const isMediaStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
    const isMediaFullscreen = window.matchMedia?.('(display-mode: fullscreen)').matches ?? false;
    const isMediaMinimal = window.matchMedia?.('(display-mode: minimal-ui)').matches ?? false;
    const isMediaOverlay = window.matchMedia?.('(display-mode: window-controls-overlay)').matches ?? false;

    // Check iOS Safari standalone property
    const isIosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;

    // Check android-app referrer or query parameter
    const isReferrerPwa = document.referrer?.startsWith('android-app://') ?? false;
    const isUrlPwa = window.location.search.includes('source=pwa');

    const standalone =
      isMediaStandalone ||
      isMediaFullscreen ||
      isMediaMinimal ||
      isMediaOverlay ||
      isIosStandalone ||
      isReferrerPwa ||
      isUrlPwa;

    this.isStandalone.set(standalone);

    // Watch for standalone changes
    if (window.matchMedia) {
      this.standaloneMediaQueryList = window.matchMedia('(display-mode: standalone)');
      this.standaloneMediaQueryList.addEventListener('change', this.onDisplayModeChange);
    }
  }

  private readonly onDisplayModeChange = (e: MediaQueryListEvent): void => {
    if (e.matches) {
      this.isStandalone.set(true);
      this.showBanner.set(false);
    }
  };

  // ── Event Listeners ─────────────────────────────────────────
  private setupListeners(): void {
    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.onAppInstalled);
  }

  private cleanupListeners(): void {
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.onAppInstalled);
    if (this.standaloneMediaQueryList) {
      this.standaloneMediaQueryList.removeEventListener('change', this.onDisplayModeChange);
    }
  }

  // Service Worker Updates
  private setupUpdateManagement(): void {
    if (!this.swUpdate?.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.handleVersionEvent(event));

    this.swUpdate.unrecoverable
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.reloadAfterUnrecoverableState(event));

    this.ngZone.runOutsideAngular(() => {
      merge(
        interval(this.UPDATE_CHECK_INTERVAL_MS),
        fromEvent(window, 'online'),
        fromEvent(window, 'focus'),
        fromEvent(document, 'visibilitychange').pipe(
          filter(() => document.visibilityState === 'visible')
        )
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          void this.checkForUpdate();
        });

      void this.waitForServiceWorkerReady()
        .then(() => this.checkForUpdate(true))
        .catch((error: unknown) => this.handleUpdateError(error, 'ready'));
    });
  }

  private async waitForServiceWorkerReady(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    await navigator.serviceWorker.ready;
  }

  private async checkForUpdate(force = false): Promise<void> {
    if (!this.swUpdate?.isEnabled || this.isActivatingUpdate) return;
    if (navigator.onLine === false) return;

    const now = Date.now();
    if (!force && now - this.lastUpdateCheckAt < this.UPDATE_CHECK_THROTTLE_MS) return;
    this.lastUpdateCheckAt = now;

    try {
      await this.swUpdate.checkForUpdate();
    } catch (error) {
      this.handleUpdateError(error, 'check');
    }
  }

  private handleVersionEvent(event: VersionEvent): void {
    switch (event.type) {
      case 'VERSION_DETECTED':
        this.ngZone.run(() => {
          this.updateInProgress.set(true);
          this.updateAvailable.set(false);
          this.updateError.set(null);
        });
        break;

      case 'VERSION_READY':
        this.ngZone.run(() => {
          this.updateInProgress.set(false);
          this.updateAvailable.set(true);
          this.updateError.set(null);
        });
        void this.activateAndReload(event);
        break;

      case 'VERSION_INSTALLATION_FAILED':
        this.ngZone.run(() => {
          this.updateInProgress.set(false);
          this.updateError.set(event.error || 'Service worker update installation failed.');
        });
        console.warn('[PWA] Service worker update installation failed:', event.error);
        break;

      case 'NO_NEW_VERSION_DETECTED':
        this.ngZone.run(() => {
          this.updateInProgress.set(false);
          this.updateError.set(null);
        });
        break;
    }
  }

  private async activateAndReload(event: VersionReadyEvent): Promise<void> {
    if (!this.swUpdate?.isEnabled || this.isActivatingUpdate) return;

    this.isActivatingUpdate = true;
    try {
      console.info('[PWA] Activation automatique de la nouvelle version PWA:', event.latestVersion.hash);
      await this.swUpdate.activateUpdate();
      window.location.reload();
    } catch (error) {
      this.isActivatingUpdate = false;
      this.handleUpdateError(error, 'activate');
    }
  }

  private reloadAfterUnrecoverableState(event: UnrecoverableStateEvent): void {
    const reason = event.reason || 'unknown';
    console.error('[PWA] Unrecoverable service worker state:', reason);

    if (this.readSessionStorage(this.UNRECOVERABLE_RELOAD_KEY) === reason) return;

    this.writeSessionStorage(this.UNRECOVERABLE_RELOAD_KEY, reason);
    window.location.reload();
  }

  private handleUpdateError(error: unknown, phase: 'ready' | 'check' | 'activate'): void {
    const message = this.formatError(error);
    this.ngZone.run(() => {
      this.updateInProgress.set(false);
      this.updateError.set(message);
    });
    console.warn(`[PWA] Service worker update ${phase} failed:`, error);
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  private readSessionStorage(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeSessionStorage(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {}
  }

  private removeSessionStorage(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }

  private readonly onBeforeInstallPrompt = (event: Event): void => {
    // Prevent default browser infobar
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    this.canPromptNative.set(true);

    this.evaluateBannerVisibility();
  };

  private readonly onAppInstalled = (): void => {
    this.isStandalone.set(true);
    this.canPromptNative.set(false);
    this.deferredPrompt = null;
    this.showBanner.set(false);
  };

  // ── Prompt Visibility Evaluation ────────────────────────────
  private readonly PROMPT_SHOWN_KEY = 'fotolou_pwa_install_prompt_seen';

  private evaluateBannerVisibility(): void {
    if (!this.isBrowser || this.isStandalone()) {
      this.showBanner.set(false);
      return;
    }

    try {
      const alreadySeen = localStorage.getItem(this.PROMPT_SHOWN_KEY) === 'true';
      if (alreadySeen) {
        this.showBanner.set(false);
        return;
      }

      // Show popup once and remember it so it won't re-appear on refresh
      this.showBanner.set(true);
      localStorage.setItem(this.PROMPT_SHOWN_KEY, 'true');
    } catch {
      this.showBanner.set(false);
    }
  }

  // ── Public User Actions ─────────────────────────────────────
  async promptInstall(): Promise<void> {
    if (this.isBrowser) {
      try {
        localStorage.setItem(this.PROMPT_SHOWN_KEY, 'true');
      } catch {}
    }

    // If native prompt is available (Android Chrome / Chromium)
    if (this.deferredPrompt) {
      try {
        await this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          this.showBanner.set(false);
          this.canPromptNative.set(false);
          this.deferredPrompt = null;
        }
      } catch (err) {
        console.warn('[PWA] Native prompt error:', err);
      }
    }
  }

  dismissBanner(): void {
    this.showBanner.set(false);
    if (this.isBrowser) {
      try {
        localStorage.setItem(this.PROMPT_SHOWN_KEY, 'true');
      } catch {}
    }
  }
}
