import { Component, input } from '@angular/core';

export type IconName =
  | 'home'
  | 'fuel'
  | 'wrench'
  | 'chart'
  | 'car'
  | 'garage'
  | 'plus'
  | 'x'
  | 'check'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'arrow-right'
  | 'arrow-left'
  | 'settings'
  | 'logout'
  | 'sun'
  | 'moon'
  | 'cloud-off'
  | 'refresh'
  | 'alert-triangle'
  | 'clock'
  | 'calendar'
  | 'map-pin'
  | 'gauge'
  | 'euro'
  | 'trend-down'
  | 'download'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'user'
  | 'trash'
  | 'sparkles'
  | 'shield'
  | 'zap'
  | 'droplet'
  | 'file-text'
  | 'check-circle'
  | 'info'
  | 'pencil'
  | 'sync'
  | 'menu'
  | 'leaf'
  | 'route'
  | 'filter'
  | 'search'
  | 'crosshair'
  | 'camera'
  | 'languages'
  | 'more';

@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('home') {
          <path d="m3 10.5 9-7.5 9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M9 22v-9h6v9" />
        }
        @case ('fuel') {
          <line x1="3" x2="15" y1="22" y2="22" />
          <path d="M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18" />
          <path d="M4 10h10" />
          <path d="M14 14h2a2 2 0 0 1 2 2v2.5a1.5 1.5 0 0 0 3 0V10l-3-3" />
        }
        @case ('wrench') {
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
        }
        @case ('chart') {
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        }
        @case ('car') {
          <path d="M5 17H3v-4l2-5h14l2 5v4h-2" />
          <path d="M3 13h18" />
          <path d="M7 17h10" />
          <circle cx="7.5" cy="17.5" r="2" />
          <circle cx="16.5" cy="17.5" r="2" />
          <path d="M6 8h12" />
        }
        @case ('garage') {
          <path d="M3 21V9l9-6 9 6v12" />
          <path d="M7 21v-8h10v8" />
          <path d="M9 17h6" />
          <path d="M7 9h10" />
        }
        @case ('plus') {
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        }
        @case ('x') {
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        }
        @case ('check') {
          <path d="M20 6 9 17l-5-5" />
        }
        @case ('chevron-down') {
          <path d="m6 9 6 6 6-6" />
        }
        @case ('chevron-right') {
          <path d="m9 18 6-6-6-6" />
        }
        @case ('chevron-left') {
          <path d="m15 18-6-6 6-6" />
        }
        @case ('arrow-right') {
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        }
        @case ('arrow-left') {
          <path d="M19 12H5" />
          <path d="m11 18-6-6 6-6" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        }
        @case ('logout') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        }
        @case ('moon') {
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        }
        @case ('cloud-off') {
          <path d="m2 2 20 20" />
          <path d="M5.8 5.8A5 5 0 0 0 6 15h10.5a5 5 0 0 0 1.7-.3" />
          <path d="M9 5a5 5 0 0 1 8.7 3 4.5 4.5 0 0 1 3.2 5.7" />
          <path d="M3 15a5 5 0 0 1 2.8-4.5" />
        }
        @case ('refresh') {
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        }
        @case ('alert-triangle') {
          <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14a2 2 0 0 0 1.73 3h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        }
        @case ('calendar') {
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        }
        @case ('map-pin') {
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        }
        @case ('gauge') {
          <path d="m12 14 4-4" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
          <path d="M12 20h.01" />
        }
        @case ('euro') {
          <path d="M4 10h12" />
          <path d="M4 14h9" />
          <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
        }
        @case ('trend-down') {
          <path d="m22 17-8.5-8.5-5 5L2 7" />
          <path d="M16 17h6v-6" />
        }
        @case ('download') {
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m7 10 5 5 5-5" />
          <path d="M12 15V3" />
        }
        @case ('mail') {
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 6L2 7" />
        }
        @case ('lock') {
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        }
        @case ('eye') {
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('eye-off') {
          <path d="m2 2 20 20" />
          <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
          <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.3 3.3" />
          <path d="M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        }
        @case ('trash') {
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M10 11v6M14 11v6" />
        }
        @case ('sparkles') {
          <path d="m12 3-1.3 3.4L7 8l3.7 1.6L12 13l1.3-3.4L17 8l-3.7-1.6Z" />
          <path d="M5 14l-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8Z" />
          <path d="M19 14l-.8 2.2L16 17l2.2.8L19 20l.8-2.2L22 17l-2.2-.8Z" />
        }
        @case ('shield') {
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        }
        @case ('zap') {
          <path d="M13 2 3 14h8l-1 8 10-12h-8Z" />
        }
        @case ('droplet') {
          <path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7Z" />
        }
        @case ('file-text') {
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6M8 13h8M8 17h6" />
        }
        @case ('check-circle') {
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        }
        @case ('pencil') {
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        }
        @case ('sync') {
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        }
        @case ('menu') {
          <path d="M4 6h16M4 12h16M4 18h16" />
        }
        @case ('leaf') {
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8a7 7 0 0 1-7 7Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.5 12 13 13 12" />
        }
        @case ('route') {
          <circle cx="6" cy="19" r="3" />
          <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
          <circle cx="18" cy="5" r="3" />
        }
        @case ('filter') {
          <path d="M22 3H2l8 9.46V19l4 2v-8.54Z" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        }
        @case ('crosshair') {
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="1.5" />
        }
        @case ('camera') {
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
          <circle cx="12" cy="13" r="3" />
        }
        @case ('languages') {
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18Z" />
        }
        @case ('more') {
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        }
      }
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly strokeWidth = input(1.8);
}
