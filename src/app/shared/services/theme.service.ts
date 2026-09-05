import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'fotolou-app-theme';
  readonly theme = signal<AppTheme>(this.readInitialTheme());

  constructor() {
    document.body.classList.remove('dark-theme');
    effect(() => {
      const activeTheme = this.theme();
      this.applyThemeToDOM(activeTheme);
      globalThis.localStorage?.setItem(this.storageKey, activeTheme);
    });
  }

  setTheme(newTheme: AppTheme): void {
    this.theme.set(newTheme);
  }

  private applyThemeToDOM(themeMode: AppTheme): void {
    document.body.classList.remove('dark-theme');
  }

  private readInitialTheme(): AppTheme {
    return 'light';
  }
}
