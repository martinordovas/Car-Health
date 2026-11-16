import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { hasTranslation, type TranslationKey } from './i18n';
import { I18nService } from './i18n.service';

export interface PlaceSuggestion {
  id: string;
  name: string;
  address: string;
  label: string;
  lat: number;
  lon: number;
  kind: string;
  countryCode: string;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

const KIND_BY_KEY: Record<string, TranslationKey> = {
  'highway:residential': 'places.kind.street',
  'landuse:residential': 'places.kind.residential_area',
  'place:locality': 'places.kind.locality',
  'place:city': 'places.kind.city',
  'place:town': 'places.kind.town',
  'place:village': 'places.kind.village',
  'place:hamlet': 'places.kind.hamlet',
  'shop:car': 'places.kind.car',
  'shop:car_repair': 'places.kind.car_repair',
  'shop:car_parts': 'places.kind.car_parts',
  'shop:fuel': 'places.kind.fuel',
  'amenity:fuel': 'places.kind.fuel',
  'amenity:parking': 'places.kind.parking',
  'boundary:administrative': 'places.kind.administrative',
  'building:yes': 'places.kind.building',
  'building:house': 'places.kind.building',
};

@Injectable({ providedIn: 'root' })
export class PlaceSearchService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly base = 'https://photon.komoot.io';

  search(
    query: string,
    coords?: { lat: number; lon: number } | null,
  ): Observable<PlaceSuggestion[]> {
    const text = query.trim();
    if (text.length < 3) {
      return of([]);
    }

    const params: Record<string, string> = {
      q: text,
      limit: '6',
    };
    if (coords) {
      params['lat'] = coords.lat.toFixed(6);
      params['lon'] = coords.lon.toFixed(6);
    }

    return this.http
      .get<PhotonResponse>(`${this.base}/api/`, { params })
      .pipe(map((response) => this.rank(response.features, text)));
  }

  reverse(lat: number, lon: number): Observable<PlaceSuggestion | null> {
    return this.http
      .get<PhotonResponse>(`${this.base}/reverse`, {
        params: { lat: lat.toFixed(6), lon: lon.toFixed(6), limit: '1' },
      })
      .pipe(map((response) => this.toSuggestions(response.features)[0] ?? null));
  }

  private toSuggestions(features: PhotonFeature[] | undefined): PlaceSuggestion[] {
    if (!features) return [];
    const seen = new Set<string>();
    const suggestions: PlaceSuggestion[] = [];

    for (const feature of features) {
      const place = this.toSuggestion(feature);
      if (!place || seen.has(place.label)) continue;
      seen.add(place.label);
      suggestions.push(place);
    }
    return suggestions;
  }

  /**
   * Photon devuelve resultados difusos mezclados con coincidencias reales.
   * Primero nos quedamos con los que contienen todas las palabras buscadas
   * (en nombre, dirección o tipo) y, si hay resultados españoles, ocultamos
   * el ruido de otros países. Si no hay coincidencias exactas, devolvemos
   * los resultados originales para no dejar la búsqueda vacía.
   */
  private rank(features: PhotonFeature[] | undefined, query: string): PlaceSuggestion[] {
    const all = this.toSuggestions(features);
    const tokens = this.normalize(query)
      .split(/\s+/)
      .filter((token) => token.length > 1);

    const matching = all.filter((place) => {
      const haystack = this.normalize(`${place.name} ${place.address} ${place.kind}`);
      return tokens.every((token) => haystack.includes(token));
    });
    const relevant = matching.length > 0 ? matching : all;

    const domestic = relevant.filter((place) => place.countryCode === 'ES');
    return (domestic.length > 0 ? domestic : relevant).slice(0, 6);
  }

  private normalize(value: string): string {
    return value
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  private toSuggestion(feature: PhotonFeature): PlaceSuggestion | null {
    const [lon, lat] = feature.geometry?.coordinates ?? [];
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;

    const properties = feature.properties ?? {};
    const street = [properties.street, properties.housenumber].filter(Boolean).join(' ');
    const city = [properties.postcode, properties.city].filter(Boolean).join(' ');
    const country = this.countryName(properties.countrycode, properties.country);
    const fallback = properties.city ?? properties.district ?? country ?? this.i18n.t('places.kind.other');
    const name = this.clean(properties.name) ?? this.clean(street) ?? fallback;
    // No usamos `state`: Photon a veces devuelve el nombre administrativo
    // en un idioma inesperado (p. ej. "Katalonien"). Ciudad + país bastan
    // para identificar la ubicación y el país se muestra en el idioma activo.
    const address = [street, city, country]
      .map((part) => this.clean(part))
      .filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index)
      .join(', ');
    const label = [name, address].filter(Boolean).join(' · ').slice(0, 160);
    const kind = this.kindLabel(properties);

    return {
      id: `${properties.osm_type ?? 'place'}-${properties.osm_id ?? label}`,
      name,
      address: address || fallback,
      label,
      lat,
      lon,
      kind,
      countryCode: properties.countrycode ?? '',
    };
  }

  private clean(value: string | null | undefined): string | null {
    const text = value?.trim();
    return text ? text : null;
  }

  private countryName(code: string | undefined, fallback: string | undefined): string | null {
    const normalized = code?.trim().toUpperCase();
    if (normalized && typeof Intl.DisplayNames !== 'undefined') {
      const translated = new Intl.DisplayNames([this.i18n.locale()], { type: 'region' }).of(normalized);
      if (translated) {
        return translated;
      }
    }
    return this.clean(fallback);
  }

  private kindLabel(properties: PhotonFeature['properties']): string {
    const keyed = KIND_BY_KEY[`${properties.osm_key ?? ''}:${properties.osm_value ?? ''}`];
    if (keyed) {
      return this.i18n.t(keyed);
    }

    const direct = `places.kind.${properties.osm_value ?? ''}`;
    if (hasTranslation(direct)) {
      return this.i18n.t(direct);
    }

    const type = `places.kind.${properties.type ?? 'other'}`;
    if (hasTranslation(type)) {
      return this.i18n.t(type);
    }

    return this.i18n.t('places.kind.other');
  }
}
