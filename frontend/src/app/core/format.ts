import { HttpErrorResponse } from '@angular/common/http';
import type { FuelType, MaintenanceStatus, PerformedBy, ServiceCategory } from './models';

const euro = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const euroZero = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const oneDecimal = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const twoDecimals = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const threeDecimals = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const integer = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

const shortDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });
const mediumDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });
const relativeFormat = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });

export function money(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return decimals === 0 ? euroZero.format(value) : euro.format(value);
}

export function moneyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return money(value, 0);
}

export function decimal(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (digits >= 3) return threeDecimals.format(value);
  if (digits === 2) return twoDecimals.format(value);
  return oneDecimal.format(value);
}

export function price(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${threeDecimals.format(value)} €`;
}

export function km(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${integer.format(value)} km`;
}

export function liters(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${oneDecimal.format(value)} L`;
}

export function consumption(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${oneDecimal.format(value)} L/100`;
}

export function percent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${oneDecimal.format(value)} %`;
}

export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  // LocalDate / LocalDateTime sin zona: se interpretan como hora local.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
  return new Date(value);
}

export function dateShort(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  return date ? shortDate.format(date).replace('.', '') : '—';
}

export function dateMedium(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  return date ? mediumDate.format(date).replace('.', '') : '—';
}

export function dateTime(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  return date ? `${mediumDate.format(date).replace('.', '')} · ${timeFormat.format(date)}` : '—';
}

export function timeOnly(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  return date ? timeFormat.format(date) : '';
}

export function relativeDay(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';
  const today = new Date();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((day.getTime() - now.getTime()) / 86_400_000);
  if (diff === 0) return 'Hoy';
  if (diff === -1) return 'Ayer';
  if (diff > -7 && diff < 0) return relativeFormat.format(diff, 'day');
  return dateShort(date);
}

export function remainingDays(days: number | null | undefined): string {
  if (days === null || days === undefined) return 'Sin fecha';
  if (days < 0) return `${integer.format(Math.abs(days))} días de retraso`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Queda 1 día';
  return `Quedan ${integer.format(days)} días`;
}

export function remainingKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Sin límite';
  if (value < 0) return `${km(Math.abs(value))} de exceso`;
  return `Quedan ${km(value)}`;
}

export function todayInputDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function nowInputDateTime(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function initials(value: string | null | undefined): string {
  if (!value) return 'CH';
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Reparación',
  MODIFICATION: 'Mejora',
  LEGAL: 'Legal',
};

export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  PREVENTIVE: 'success',
  CORRECTIVE: 'danger',
  MODIFICATION: 'info',
  LEGAL: 'warning',
};

export const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  OVERDUE: 'Vencido',
  DUE_SOON: 'Próximo',
  OK: 'Al día',
  UNKNOWN: 'Sin datos',
};

export const PERFORMED_BY_LABELS: Record<PerformedBy, string> = {
  DIY: 'Por mi cuenta',
  WORKSHOP: 'Taller',
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE_95: 'Gasolina 95',
  GASOLINE_98: 'Gasolina 98',
  DIESEL: 'Diésel',
  HYBRID: 'Híbrido',
  PLUG_IN_HYBRID: 'Híbrido enchufable',
  ELECTRIC: 'Eléctrico',
  LPG: 'GLP',
  OTHER: 'Otro',
};

export function categoryLabel(category: ServiceCategory | null | undefined): string {
  return category ? CATEGORY_LABELS[category] : 'Intervención';
}

export function statusLabel(status: MaintenanceStatus | null | undefined): string {
  return status ? STATUS_LABELS[status] : 'Sin datos';
}

export function fuelName(type: FuelType | null | undefined): string {
  return type ? FUEL_TYPE_LABELS[type] : 'Combustible';
}

export function categoryTone(category: ServiceCategory | null | undefined): string {
  if (!category) return 'chip-neutral';
  return `chip-${CATEGORY_COLORS[category]}`;
}

export function statusTone(status: MaintenanceStatus | null | undefined): string {
  switch (status) {
    case 'OVERDUE':
      return 'chip-danger';
    case 'DUE_SOON':
      return 'chip-warning';
    case 'OK':
      return 'chip-success';
    default:
      return 'chip-neutral';
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No hay conexión con el servidor. El dato se guardará en tu dispositivo.';
    const detail = error.error?.detail;
    const errors = error.error?.errors;
    if (errors && typeof errors === 'object') {
      const first = Object.values(errors)[0];
      if (typeof first === 'string') return first;
    }
    if (typeof detail === 'string') return detail;
    if (error.status === 401) return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes permisos para esta acción.';
    if (error.status === 404) return 'No hemos encontrado ese recurso.';
    if (error.status >= 500) return 'El servidor no está disponible ahora mismo.';
    return 'No se ha podido completar la operación.';
  }
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error inesperado.';
}

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) return false;
  return error.status === 0 || [502, 503, 504].includes(error.status);
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ch-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
