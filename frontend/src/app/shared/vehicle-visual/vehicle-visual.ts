import { Component, input } from '@angular/core';

@Component({
  selector: 'app-vehicle-visual',
  template: `
    @if (photo()) {
      <div class="relative overflow-hidden rounded-[22px] border border-white/15 bg-[#081f15] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]">
        <img
          [src]="photo()"
          alt="Foto del vehículo"
          class="aspect-[16/10] w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071a11]/75 via-transparent to-transparent"></div>
        <div class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5">
          <span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white/80 backdrop-blur">
            <span class="size-1.5 rounded-full bg-accent"></span>
            Foto real
          </span>
          @if (label()) {
            <span class="rounded-full border border-accent/30 bg-black/40 px-2.5 py-1 text-[10px] font-bold text-accent backdrop-blur">
              {{ label() }}
            </span>
          }
        </div>
      </div>
    } @else {
    <svg
      class="h-auto w-full overflow-visible"
      viewBox="0 0 640 270"
      fill="none"
      role="img"
      aria-label="Ilustración del vehículo"
    >
      <defs>
        <linearGradient [attr.id]="bodyGradient" x1="110" y1="88" x2="510" y2="218" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E8F1E6" />
          <stop offset=".52" stop-color="#BFD1C0" />
          <stop offset="1" stop-color="#8CA594" />
        </linearGradient>
        <linearGradient [attr.id]="glassGradient" x1="260" y1="88" x2="390" y2="140" gradientUnits="userSpaceOnUse">
          <stop stop-color="#375B4D" />
          <stop offset="1" stop-color="#172F26" />
        </linearGradient>
        <linearGradient [attr.id]="wheelGradient" x1="140" y1="165" x2="230" y2="240" gradientUnits="userSpaceOnUse">
          <stop stop-color="#26332C" />
          <stop offset="1" stop-color="#080D0A" />
        </linearGradient>
        <linearGradient [attr.id]="rimGradient" x1="150" y1="175" x2="210" y2="230" gradientUnits="userSpaceOnUse">
          <stop stop-color="#EAF1E6" />
          <stop offset="1" stop-color="#7C9184" />
        </linearGradient>
        <filter [attr.id]="glowFilter" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient [attr.id]="haloGradient" cx="0" cy="0" r="1" gradientTransform="translate(510 90) rotate(135) scale(250)" gradientUnits="userSpaceOnUse">
          <stop stop-color="#C9F25C" stop-opacity=".18" />
          <stop offset="1" stop-color="#C9F25C" stop-opacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="326" cy="244" rx="258" ry="20" fill="#000" opacity=".25" />
      <ellipse cx="500" cy="140" rx="250" ry="150" [attr.fill]="'url(#' + haloGradient + ')'" />

      <g opacity=".25" stroke="#C9F25C" stroke-width="1">
        <path d="M22 228h596" />
        <path d="M92 246h72M236 246h72M380 246h72M524 246h54" stroke-dasharray="8 14" />
      </g>

      <!-- cuerpo -->
      <path
        d="M64 180c1-19 15-31 40-36l68-14c25-26 59-42 100-46h105c42 3 73 20 99 49l59 12c24 5 37 17 38 34v10c0 8-6 14-14 14h-47a55 55 0 0 0-107 0H230a55 55 0 0 0-107 0H85c-13 0-21-8-21-20v-3Z"
        [attr.fill]="'url(#' + bodyGradient + ')'"
      />
      <path
        d="M64 180c1-19 15-31 40-36l68-14c25-26 59-42 100-46h105c42 3 73 20 99 49l59 12c24 5 37 17 38 34"
        stroke="#F2F8F0"
        stroke-opacity=".4"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path d="M64 189h36M566 189h37" stroke="#4C6656" stroke-width="3" stroke-linecap="round" opacity=".4" />

      <!-- ventanas -->
      <path d="M220 128c23-23 49-35 78-38l40-1v44l-118-5Z" [attr.fill]="'url(#' + glassGradient + ')'" />
      <path d="M350 89h36c34 3 62 17 85 42l-121 2V89Z" [attr.fill]="'url(#' + glassGradient + ')'" />
      <path d="M341 89v45" stroke="#0E1F18" stroke-width="5" />
      <path d="M225 123c23-20 47-30 73-33" stroke="#94B6A7" stroke-width="1.5" stroke-linecap="round" opacity=".6" />
      <path d="M361 96c27 3 49 14 67 33" stroke="#94B6A7" stroke-width="1.5" stroke-linecap="round" opacity=".45" />

      <!-- detalles -->
      <path d="M343 139v58" stroke="#789083" stroke-width="1.5" opacity=".65" />
      <path d="M440 142h31c5 0 9 2 12 6" stroke="#789083" stroke-width="1.5" stroke-linecap="round" opacity=".55" />
      <path d="M456 152c6 0 12 1 17 4" stroke="#4F6759" stroke-width="5" stroke-linecap="round" />
      <path d="M182 137c4-6 10-9 17-10" stroke="#6F8779" stroke-width="2" stroke-linecap="round" opacity=".65" />
      <path d="M70 174l22-3" stroke="#6F8779" stroke-width="1.5" stroke-linecap="round" opacity=".6" />
      <path d="M80 160l28 5M80 169l28 3" stroke="#C9F25C" stroke-width="3" stroke-linecap="round" opacity=".75" />
      <path d="M510 143c18 3 30 8 39 13" stroke="#F2F8F0" stroke-width="2" stroke-linecap="round" opacity=".35" />

      <!-- faro y piloto -->
      <path d="M544 151h23c6 0 10 4 10 9v3h-35l2-12Z" fill="#F4FFD9" opacity=".95" />
      <path d="M544 151h23c6 0 10 4 10 9v3h-35l2-12Z" stroke="#C9F25C" stroke-width="1.5" [attr.filter]="'url(#' + glowFilter + ')'" />
      <path d="M61 158l28 2-2 13H66c-5 0-8-3-8-7l3-8Z" fill="#FF7B64" opacity=".9" />
      <path d="M61 158l28 2-2 13H66c-5 0-8-3-8-7l3-8Z" stroke="#FFB4A7" stroke-width="1" />

      <!-- bajos -->
      <path d="M231 197h106M122 197h54M431 197h53" stroke="#435C4D" stroke-width="4" stroke-linecap="round" opacity=".55" />
      <path d="M110 205h76M250 205h118M474 205h52" stroke="#5C7465" stroke-width="2" stroke-linecap="round" opacity=".35" />

      <!-- ruedas -->
      <g>
        <circle cx="177" cy="197" r="50" [attr.fill]="'url(#' + wheelGradient + ')'" />
        <circle cx="177" cy="197" r="34" fill="#101915" />
        <circle cx="177" cy="197" r="27" [attr.fill]="'url(#' + rimGradient + ')'" />
        <circle cx="177" cy="197" r="23" fill="#22332A" />
        <g stroke="#DDE9DA" stroke-width="4" stroke-linecap="round" opacity=".9">
          <path d="M177 180v14M162 188l9 6M192 188l-9 6M167 205l7-8M187 205l-7-8" />
        </g>
        <circle cx="177" cy="197" r="6" fill="#C9F25C" />
      </g>
      <g>
        <circle cx="468" cy="197" r="50" [attr.fill]="'url(#' + wheelGradient + ')'" />
        <circle cx="468" cy="197" r="34" fill="#101915" />
        <circle cx="468" cy="197" r="27" [attr.fill]="'url(#' + rimGradient + ')'" />
        <circle cx="468" cy="197" r="23" fill="#22332A" />
        <g stroke="#DDE9DA" stroke-width="4" stroke-linecap="round" opacity=".9">
          <path d="M468 180v14M453 188l9 6M483 188l-9 6M458 205l7-8M478 205l-7-8" />
        </g>
        <circle cx="468" cy="197" r="6" fill="#C9F25C" />
      </g>

      <!-- sombra bajo el coche -->
      <path d="M126 234c38 10 340 10 390 0" stroke="#07110C" stroke-width="9" stroke-linecap="round" opacity=".25" />

      @if (label()) {
        <g>
          <rect x="488" y="38" width="112" height="32" rx="16" fill="#0B2118" fill-opacity=".7" stroke="#C9F25C" stroke-opacity=".35" />
          <circle cx="506" cy="54" r="4" fill="#C9F25C" />
          <text x="518" y="58" fill="#EAF3E7" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" letter-spacing=".5">{{ label() }}</text>
        </g>
      }
    </svg>
    }
  `,
})
export class VehicleVisualComponent {
  readonly label = input<string>('');
  readonly photo = input<string | null | undefined>(null);
  readonly bodyGradient = `body-${Math.random().toString(36).slice(2, 8)}`;
  readonly glassGradient = `glass-${Math.random().toString(36).slice(2, 8)}`;
  readonly wheelGradient = `wheel-${Math.random().toString(36).slice(2, 8)}`;
  readonly rimGradient = `rim-${Math.random().toString(36).slice(2, 8)}`;
  readonly glowFilter = `glow-${Math.random().toString(36).slice(2, 8)}`;
  readonly haloGradient = `halo-${Math.random().toString(36).slice(2, 8)}`;
}
