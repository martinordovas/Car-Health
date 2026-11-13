import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'ch-theme';
type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeState = signal<Theme>(this.currentTheme());
  readonly theme = this.themeState.asReadonly();
  readonly dark = signal(document.documentElement.classList.contains('dark'));

  constructor() {
    this.apply(this.dark());
  }

  toggle(): void {
    this.apply(!this.dark());
  }

  set(theme: Theme): void {
    this.apply(theme === 'dark');
  }

  private apply(dark: boolean): void {
    this.dark.set(dark);
    this.themeState.set(dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    } catch {
      // Ignorar.
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#090e0b' : '#f2f4ef');
  }

  private currentTheme(): Theme {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Ignorar.
    }
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
}
