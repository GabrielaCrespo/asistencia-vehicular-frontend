import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  
  themeSignal = signal<ThemeMode>(this.loadTheme());

  constructor() {
    // Efecto para aplicar el tema al cambiar
    effect(() => {
      const theme = this.themeSignal();
      this.applyTheme(theme);
      localStorage.setItem(this.THEME_KEY, theme);
    });
  }

  private loadTheme(): ThemeMode {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeMode | null;
    if (savedTheme) return savedTheme;

    // Detectar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  private applyTheme(theme: ThemeMode): void {
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
      htmlElement.classList.add('dark-theme');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark-theme');
      htmlElement.style.colorScheme = 'light';
    }
  }

  toggleTheme(): void {
    this.themeSignal.set(this.themeSignal() === 'light' ? 'dark' : 'light');
  }

  getCurrentTheme(): ThemeMode {
    return this.themeSignal();
  }
}
