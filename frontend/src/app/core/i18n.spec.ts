import { afterEach, describe, expect, it } from 'vitest';
import es from '../i18n/es.json';
import en from '../i18n/en.json';
import { dictionaryKeys, setActiveLocale, translate, translatePlural } from './i18n';

describe('i18n', () => {
  afterEach(() => setActiveLocale('es'));

  it('mantiene las mismas claves en español e inglés', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
    expect(dictionaryKeys('es')).toHaveLength(Object.keys(es).length);
    expect(dictionaryKeys('en')).toHaveLength(Object.keys(en).length);
  });

  it('traduce y sustituye parámetros', () => {
    setActiveLocale('es');
    expect(translate('layout.navHome')).toBe('Inicio');
    expect(translate('dashboard.vehicleToday', { vehicle: 'El León' })).toBe('Así va El León hoy.');

    setActiveLocale('en');
    expect(translate('layout.navHome')).toBe('Home');
    expect(translate('dashboard.vehicleToday', { vehicle: 'El León' })).toBe(
      'How El León is doing today.',
    );
  });

  it('resuelve plurales en ambos idiomas', () => {
    setActiveLocale('es');
    expect(translatePlural('maintenance.partsCount', 1)).toBe('1 recambio');
    expect(translatePlural('maintenance.partsCount', 3)).toBe('3 recambios');

    setActiveLocale('en');
    expect(translatePlural('maintenance.partsCount', 1)).toBe('1 part');
    expect(translatePlural('maintenance.partsCount', 3)).toBe('3 parts');
  });
});
