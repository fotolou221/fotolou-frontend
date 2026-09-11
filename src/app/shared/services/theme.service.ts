import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'fotolou-app-theme';
  readonly theme = signal<AppTheme>(this.readInitialTheme());

  private systemMediaQuery: MediaQueryList | null = null;
  private readonly systemMediaListener = () => {
    if (this.theme() === 'system') {
      this.applyThemeToDOM('system');
    }
  };

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemMediaQuery.addEventListener('change', this.systemMediaListener);
    }

    effect(() => {
      const activeTheme = this.theme();
      this.applyThemeToDOM(activeTheme);
      try {
        globalThis.localStorage?.setItem(this.storageKey, activeTheme);
      } catch (e) {
        console.warn('[ThemeService] Unable to save theme to localStorage:', e);
      }
    });
  }

  setTheme(newTheme: AppTheme): void {
    this.theme.set(newTheme);
  }

  toggleTheme(): void {
    const current = this.theme();
    if (current === 'dark') {
      this.setTheme('light');
    } else {
      this.setTheme('dark');
    }
  }

  private applyThemeToDOM(themeMode: AppTheme): void {
    if (typeof document === 'undefined') return;

    let isDark = false;
    if (themeMode === 'dark') {
      isDark = true;
    } else if (themeMode === 'system') {
      isDark = Boolean(this.systemMediaQuery?.matches);
    }

    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (isDark) {
      bodyEl.classList.add('dark-theme');
      htmlEl.classList.add('dark-theme');
      htmlEl.setAttribute('data-theme', 'dark');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#0b132b');
      }
    } else {
      bodyEl.classList.remove('dark-theme');
      htmlEl.classList.remove('dark-theme');
      htmlEl.setAttribute('data-theme', 'light');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#ffffff');
      }
    }
  }

  private readInitialTheme(): AppTheme {
    try {
      if (typeof globalThis.localStorage !== 'undefined') {
        const stored = globalThis.localStorage.getItem(this.storageKey);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          return stored;
        }
      }
    } catch (e) {
      console.warn('[ThemeService] Unable to read theme from localStorage:', e);
    }
    return 'system';
  }
}
