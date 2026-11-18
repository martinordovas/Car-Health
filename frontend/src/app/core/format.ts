import { HttpErrorResponse } from '@angular/common/http';
import { localeTag, translate, translatePlural, type TranslationKey } from './i18n';
import type { FuelType, MaintenanceStatus, PerformedBy, ServiceCategory } from './models';

interface Formatters {
  euro: Intl.NumberFormat;
  euroZero: Intl.NumberFormat;
  euroThree: Intl.NumberFormat;
  oneDecimal: Intl.NumberFormat;
  twoDecimals: Intl.NumberFormat;
  threeDecimals: Intl.NumberFormat;
  integer: Intl.NumberFormat;
  compactEuro: Intl.NumberFormat;
  shortDate: Intl.DateTimeFormat;
  mediumDate: Intl.DateTimeFormat;
  time: Intl.DateTimeFormat;
  relative: Intl.RelativeTimeFormat;
}

let cachedLocale = '';
let cachedFormatters: Formatters | null = null;

function formatters(): Formatters {
  const tag = localeTag();
  if (tag === cachedLocale && cachedFormatters) return cachedFormatters;

  cachedLocale = tag;
  cachedFormatters = {
    euro: new Intl.NumberFormat(tag, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    euroZero: new Intl.NumberFormat(tag, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    euroThree: new Intl.NumberFormat(tag, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }),
    oneDecimal: new Intl.NumberFormat(tag, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
    twoDecimals: new Intl.NumberFormat(tag, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    threeDecimals: new Intl.NumberFormat(tag, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }),
    integer: new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }),
    compactEuro: new Intl.NumberFormat(tag, {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }),
    shortDate: new Intl.DateTimeFormat(tag, { day: '2-digit', month: 'short' }),
    mediumDate: new Intl.DateTimeFormat(tag, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: new Intl.DateTimeFormat(tag, { hour: '2-digit', minute: '2-digit' }),
    relative: new Intl.RelativeTimeFormat(tag, { numeric: 'auto' }),
  };
  return cachedFormatters;
}

export function money(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const format = formatters();
  return decimals === 0 ? format.euroZero.format(value) : format.euro.format(value);
}

export function moneyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (Math.abs(value) >= 1000) {
    return formatters().compactEuro.format(value);
  }
  return money(value, 0);
}

export function decimal(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const format = formatters();
  if (digits >= 3) return format.threeDecimals.format(value);
  if (digits === 2) return format.twoDecimals.format(value);
  return format.oneDecimal.format(value);
}

export function price(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return formatters().euroThree.format(value);
}

export function km(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatters().integer.format(value)} km`;
}

export function liters(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatters().oneDecimal.format(value)} L`;
}

export function consumption(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatters().oneDecimal.format(value)} L/100`;
}

export function percent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return translate('common.percent', { value: formatters().oneDecimal.format(value) });
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
  return date ? formatters().shortDate.format(date).replace(/\./g, '') : '—';
}

export function dateMedium(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  return date ? formatters().mediumDate.format(date).replace(/\./g, '') : '—';
}

export function dateTime(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';
  const format = formatters();
  return `${format.mediumDate.format(date).replace(/\./g, '')} · ${format.time.format(date)}`;
}

export function timeOnly(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  return date ? formatters().time.format(date) : '';
}

export function relativeDay(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';
  const today = new Date();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((day.getTime() - now.getTime()) / 86_400_000);
  if (diff === 0) return translate('dates.today');
  if (diff === -1) return translate('dates.yesterday');
  if (diff > -7 && diff < 0) return formatters().relative.format(diff, 'day');
  return dateShort(date);
}

export function remainingDays(days: number | null | undefined): string {
  if (days === null || days === undefined) return translate('maintenance.remaining.noDate');
  if (days < 0) {
    return translatePlural('maintenance.remaining.overdue', Math.abs(days), {
      count: Math.abs(days),
    });
  }
  if (days === 0) return translate('maintenance.remaining.today');
  return translatePlural('maintenance.remaining.left', days, { count: days });
}

export function remainingKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return translate('maintenance.remaining.noLimit');
  if (value < 0) {
    return translate('maintenance.remaining.excess', {
      km: `${formatters().integer.format(Math.abs(value))} km`,
    });
  }
  return translate('maintenance.remaining.kmLeft', {
    km: `${formatters().integer.format(value)} km`,
  });
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

export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  PREVENTIVE: 'success',
  CORRECTIVE: 'danger',
  MODIFICATION: 'info',
  LEGAL: 'warning',
};

export function categoryLabel(category: ServiceCategory | null | undefined): string {
  return translate(category ? `labels.category.${category}` : 'labels.category.none');
}

export function statusLabel(status: MaintenanceStatus | null | undefined): string {
  return translate(status ? `labels.status.${status}` : 'labels.status.UNKNOWN');
}

export function fuelName(type: FuelType | null | undefined): string {
  return translate(type ? `labels.fuelType.${type}` : 'labels.fuelType.none');
}

export function performedByLabel(value: PerformedBy | null | undefined): string {
  return translate(value ? `labels.performedBy.${value}` : 'labels.performedBy.none');
}

const RULE_NAMES: Record<string, TranslationKey> = {
  'Aceite y filtro': 'rules.oilFilter',
  'Filtro de aire': 'rules.airFilter',
  'Filtro de habitáculo': 'rules.cabinFilter',
  'Líquido de frenos': 'rules.brakeFluid',
  Bujías: 'rules.sparkPlugs',
  ITV: 'rules.mot',
};

export function ruleName(name: string | null | undefined): string {
  if (!name) return name ?? '';
  const key = RULE_NAMES[name];
  return key ? translate(key) : name;
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

const BACKEND_MESSAGES: Record<string, TranslationKey> = {
  'Correo o contraseña incorrectos.': 'errors.invalidCredentials',
  'Ya existe una cuenta con ese correo electrónico.': 'errors.emailExists',
  'La contraseña actual no es correcta.': 'errors.currentPassword',
  'La sesión ya no es válida.': 'errors.sessionInvalid',
  'Regla de mantenimiento no encontrada.': 'errors.ruleNotFound',
  'Repostaje no encontrado.': 'errors.fuelNotFound',
  'La fecha del repostaje no puede estar en el futuro.': 'errors.fuelFuture',
  'Vehículo no encontrado.': 'errors.vehicleNotFound',
  'La foto del vehículo debe ser una imagen JPEG, PNG, WebP o AVIF.': 'errors.vehiclePhotoType',
  'Intervención no encontrada.': 'errors.serviceNotFound',
  'La fecha de la intervención no puede estar en el futuro.': 'errors.serviceFuture',
  'La regla de mantenimiento no pertenece a este vehículo.': 'errors.ruleVehicle',
  'Inicia sesión para continuar.': 'errors.loginToContinue',
  'No tienes permisos para esta acción.': 'errors.forbidden',
  'Revisa los campos marcados e inténtalo de nuevo.': 'errors.reviewFields',
  'El código no es válido o ha caducado.': 'auth.verificationInvalidCode',
  'El correo ya está verificado. Inicia sesión.': 'auth.verificationAlreadyVerified',
  'Espera un momento antes de pedir otro código.': 'auth.verificationResendWait',
  'El código debe tener 6 dígitos.': 'auth.verificationCodeFormat',
  'Debes verificar tu correo electrónico antes de entrar.': 'auth.verificationExistingNotice',
  'no debe estar vacío': 'errors.validation.required',
  'no debe ser nulo': 'errors.validation.required',
  'debe ser un correo electrónico válido': 'errors.validation.email',
};

function localizeBackendMessage(message: string): string {
  const text = message.trim();
  const key = BACKEND_MESSAGES[text];
  if (key) return translate(key);

  const odometer =
    /^El odómetro no puede ser inferior al kilometraje actual del coche \((.+)\)\.$/.exec(text);
  if (odometer) {
    return translate('errors.odometerCurrent', { km: odometer[1] });
  }

  const min = /^debe ser mayor que o igual a (.+)$/.exec(text);
  if (min) return translate('errors.validation.min', { value: min[1] });

  const max = /^debe ser menor que o igual a (.+)$/.exec(text);
  if (max) return translate('errors.validation.max', { value: max[1] });

  const size = /^el tamaño debe estar entre (\d+) y (\d+)$/.exec(text);
  if (size) return translate('errors.validation.size', { min: size[1], max: size[2] });

  return text;
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return translate('errors.noConnection');
    const detail = error.error?.detail;
    const errors = error.error?.errors;
    if (errors && typeof errors === 'object') {
      const first = Object.values(errors)[0];
      if (typeof first === 'string') return localizeBackendMessage(first);
    }
    if (typeof detail === 'string') return localizeBackendMessage(detail);
    if (error.status === 401) return translate('errors.sessionExpired');
    if (error.status === 403) return translate('errors.forbidden');
    if (error.status === 404) return translate('errors.notFound');
    if (error.status >= 500) return translate('errors.server');
    return translate('errors.operation');
  }
  if (error instanceof Error) return error.message;
  return translate('errors.unexpected');
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
