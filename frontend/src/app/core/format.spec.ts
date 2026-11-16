import { HttpErrorResponse } from '@angular/common/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { setActiveLocale } from './i18n';
import {
  categoryLabel,
  consumption,
  dateMedium,
  decimal,
  errorMessage,
  initials,
  km,
  liters,
  money,
  moneyCompact,
  parseDate,
  percent,
  price,
  remainingDays,
  remainingKm,
  statusLabel,
  todayInputDate,
} from './format';

describe('format helpers', () => {
  beforeEach(() => setActiveLocale('es'));

  it('formatea importes en euros con dos decimales', () => {
    expect(money(12345.5)).toMatch(/12\.345,50\s€/);
    expect(money(0)).toMatch(/0,00\s€/);
    expect(money(42.999)).toMatch(/43,00\s€/);
  });

  it('devuelve un guion para valores vacíos', () => {
    expect(money(null)).toBe('—');
    expect(money(undefined)).toBe('—');
    expect(km(Number.NaN)).toBe('—');
  });

  it('compacta importes grandes para los KPI', () => {
    expect(moneyCompact(850)).toMatch(/850\s€/);
    expect(moneyCompact(1250)).toContain('1,3');
    expect(moneyCompact(null)).toBe('—');
  });

  it('formatea decimales con la precisión solicitada', () => {
    expect(decimal(6.789)).toBe('6,8');
    expect(decimal(6.789, 2)).toBe('6,79');
    expect(decimal(6.789, 3)).toBe('6,789');
    expect(decimal(null)).toBe('—');
  });

  it('muestra precios de carburante con tres decimales', () => {
    expect(price(1.549)).toMatch(/1,549\s€/);
    expect(price(null)).toBe('—');
  });

  it('formatea kilómetros, litros, consumo y porcentajes', () => {
    expect(km(48900)).toMatch(/48\.900\s?km/);
    expect(liters(42.35)).toMatch(/42,4\s?L/);
    expect(consumption(6.24)).toMatch(/6,2\s?L\/100/);
    expect(percent(12.34)).toMatch(/12,3\s?%/);
  });

  it('interpreta fechas ISO sin desplazar el día', () => {
    const date = parseDate('2026-11-12');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(12);
    expect(dateMedium('2026-11-12')).toContain('2026');
    expect(dateMedium('2026-11-12')).toContain('12');
    expect(parseDate(null)).toBeNull();
  });

  it('genera fechas de formulario en formato YYYY-MM-DD', () => {
    expect(todayInputDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('calcula iniciales para el avatar', () => {
    expect(initials('El León')).toBe('EL');
    expect(initials('Demo')).toBe('D');
    expect(initials('')).toBe('CH');
    expect(initials(null)).toBe('CH');
  });

  it('traduce los días restantes de mantenimiento', () => {
    expect(remainingDays(0)).toBe('Vence hoy');
    expect(remainingDays(1)).toBe('Queda 1 día');
    expect(remainingDays(12)).toBe('Quedan 12 días');
    expect(remainingDays(-3)).toBe('3 días de retraso');
    expect(remainingDays(null)).toBe('Sin fecha');
    expect(remainingKm(500)).toContain('500');
    expect(remainingKm(-120)).toContain('120');
    expect(remainingKm(null)).toBe('Sin límite');
  });

  it('traduce categorías y estados del backend', () => {
    expect(categoryLabel('PREVENTIVE')).toBe('Preventivo');
    expect(categoryLabel('CORRECTIVE')).toBe('Reparación');
    expect(categoryLabel(null)).toBe('Intervención');
    expect(statusLabel('DUE_SOON')).toBe('Próximo');
    expect(statusLabel('OVERDUE')).toBe('Vencido');
  });

  it('extrae el mensaje de error de una respuesta ProblemDetail', () => {
    expect(errorMessage(new Error('Fallo de red'))).toBe('Fallo de red');
    expect(errorMessage(null)).toBe('Ha ocurrido un error inesperado.');
  });

  it('traduce los mensajes conocidos del backend al inglés', () => {
    setActiveLocale('en');
    const unauthorized = new HttpErrorResponse({
      status: 401,
      error: { detail: 'Correo o contraseña incorrectos.' },
    });
    expect(errorMessage(unauthorized)).toBe('Incorrect email or password.');

    const invalid = new HttpErrorResponse({
      status: 400,
      error: {
        detail: 'Revisa los campos marcados e inténtalo de nuevo.',
        errors: { odometer: 'debe ser mayor que o igual a 0' },
      },
    });
    expect(errorMessage(invalid)).toBe('Must be greater than or equal to 0.');
  });

  it('cambia formato y etiquetas al inglés', () => {
    setActiveLocale('en');
    expect(money(1234.5)).toMatch(/€1,234\.50/);
    expect(percent(12.34)).toBe('12.3%');
    expect(categoryLabel('CORRECTIVE')).toBe('Repair');
    expect(statusLabel('DUE_SOON')).toBe('Due soon');
    expect(remainingDays(3)).toBe('3 days left');
  });
});
