import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PlaceSuggestion } from './place-search.service';
import { PlaceSearchService } from './place-search.service';

describe('PlaceSearchService', () => {
  let service: PlaceSearchService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('ch-locale', 'es');
    TestBed.configureTestingModule({
      providers: [PlaceSearchService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlaceSearchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('prioriza coincidencias exactas y resultados españoles', () => {
    let results: PlaceSuggestion[] = [];
    service.search('Sartopina').subscribe((value) => (results = value));

    const request = http.expectOne(
      (req) => req.url === 'https://photon.komoot.io/api/' && req.params.get('q') === 'Sartopina',
    );
    request.flush({
      features: [
        feature(
          'Sartopina Plaza',
          'Calle de Trapani',
          'Zaragoza',
          'ES',
          'car_repair',
          'Katalonien',
        ),
        feature('Caporikina', '', 'Minsk', 'BY', 'locality'),
        feature('Šatorina', '', 'Karlobag', 'HR', 'peak'),
      ],
    });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Sartopina Plaza');
    expect(results[0].kind).toBe('Taller');
    expect(results[0].label).toContain('Zaragoza');
    expect(results[0].address).toContain('España');
    expect(results[0].address).not.toContain('Katalonien');
  });

  it('conserva los resultados globales si no hay coincidencia en España', () => {
    let results: PlaceSuggestion[] = [];
    service.search('Paris').subscribe((value) => (results = value));

    const request = http.expectOne(
      (req) => req.url === 'https://photon.komoot.io/api/' && req.params.get('q') === 'Paris',
    );
    request.flush({
      features: [
        feature('Paris', 'Rue de Rivoli', 'Paris', 'FR', 'city'),
        feature('Paris', 'Main Street', 'Paris', 'US', 'city'),
      ],
    });

    expect(results).toHaveLength(2);
    expect(results[0].countryCode).toBe('FR');
    expect(results[0].kind).toBe('Ciudad');
  });

  it('traduce al español los tipos de lugar', () => {
    let results: PlaceSuggestion[] = [];
    service.search('Zaragoza').subscribe((value) => (results = value));

    const request = http.expectOne(
      (req) => req.url === 'https://photon.komoot.io/api/' && req.params.get('q') === 'Zaragoza',
    );
    request.flush({
      features: [
        feature('Zaragoza ciudad', '', 'Zaragoza', 'ES', 'city'),
        feature('Zaragoza pueblo', '', 'Zaragoza', 'ES', 'hamlet'),
        feature('Zaragoza pico', '', 'Zaragoza', 'ES', 'peak'),
      ],
    });

    expect(results.map((place) => place.kind)).toEqual(['Ciudad', 'Aldea', 'Pico']);
  });

  it('envía las coordenadas como sesgo cuando se usan', () => {
    service.search('gasolinera', { lat: 41.6488, lon: -0.8891 }).subscribe();

    const request = http.expectOne((req) => req.url === 'https://photon.komoot.io/api/');
    expect(request.request.params.get('lat')).toBe('41.648800');
    expect(request.request.params.get('lon')).toBe('-0.889100');
    request.flush({ features: [] });
  });

  it('no llama a la red con búsquedas demasiado cortas', () => {
    let results: PlaceSuggestion[] | null = null;
    service.search('ab').subscribe((value) => (results = value));
    expect(results).toEqual([]);
    http.expectNone('https://photon.komoot.io/api/');
  });
});

function feature(
  name: string,
  street: string,
  city: string,
  countrycode: string,
  osmValue: string,
  state = '',
) {
  return {
    geometry: { coordinates: [-0.8891, 41.6488] as [number, number] },
    properties: {
      osm_type: 'W',
      osm_id: Math.floor(Math.random() * 100000),
      osm_value: osmValue,
      name,
      street,
      city,
      state,
      countrycode,
    },
  };
}
