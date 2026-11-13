import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

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

const KIND_LABELS: Record<string, string> = {
  // Lugares y divisiones administrativas
  house: 'Dirección',
  street: 'Calle',
  locality: 'Localidad',
  city: 'Ciudad',
  town: 'Villa',
  village: 'Pueblo',
  hamlet: 'Aldea',
  suburb: 'Barrio',
  neighbourhood: 'Barrio',
  quarter: 'Barrio',
  district: 'Distrito',
  county: 'Comarca',
  municipality: 'Municipio',
  state: 'Provincia',
  region: 'Región',
  country: 'País',
  island: 'Isla',
  // Naturaleza
  peak: 'Pico',
  mountain: 'Montaña',
  hill: 'Colina',
  volcano: 'Volcán',
  water: 'Agua',
  river: 'Río',
  lake: 'Lago',
  bay: 'Bahía',
  beach: 'Playa',
  forest: 'Bosque',
  wood: 'Bosque',
  park: 'Parque',
  garden: 'Jardín',
  // Comercio y restauración
  fuel: 'Gasolinera',
  car: 'Concesionario',
  car_repair: 'Taller',
  car_parts: 'Recambios',
  tyres: 'Neumáticos',
  motorcycle: 'Motos',
  bicycle: 'Bicicletas',
  charging_station: 'Punto de carga',
  parking: 'Parking',
  car_wash: 'Lavadero',
  car_rental: 'Alquiler de coches',
  convenience: 'Tienda',
  supermarket: 'Supermercado',
  mall: 'Centro comercial',
  department_store: 'Grandes almacenes',
  hardware: 'Ferretería',
  doityourself: 'Bricolaje',
  furniture: 'Muebles',
  electronics: 'Electrónica',
  clothes: 'Ropa',
  shoes: 'Calzado',
  bakery: 'Panadería',
  butcher: 'Carnicería',
  greengrocer: 'Frutería',
  florist: 'Floristería',
  books: 'Librería',
  stationery: 'Papelería',
  sports: 'Deportes',
  pet: 'Mascotas',
  garden_centre: 'Centro de jardinería',
  marketplace: 'Mercado',
  restaurant: 'Restaurante',
  cafe: 'Cafetería',
  bar: 'Bar',
  pub: 'Pub',
  fast_food: 'Comida rápida',
  // Servicios y equipamientos
  pharmacy: 'Farmacia',
  hospital: 'Hospital',
  clinic: 'Clínica',
  doctors: 'Centro médico',
  dentist: 'Dentista',
  veterinary: 'Veterinario',
  school: 'Colegio',
  university: 'Universidad',
  college: 'Instituto',
  kindergarten: 'Guardería',
  library: 'Biblioteca',
  museum: 'Museo',
  theatre: 'Teatro',
  cinema: 'Cine',
  bank: 'Banco',
  atm: 'Cajero',
  post_office: 'Oficina de correos',
  police: 'Policía',
  fire_station: 'Parque de bomberos',
  townhall: 'Ayuntamiento',
  place_of_worship: 'Lugar de culto',
  bus_station: 'Estación de autobuses',
  // Turismo y ocio
  hotel: 'Hotel',
  motel: 'Motel',
  guest_house: 'Casa de huéspedes',
  hostel: 'Albergue',
  apartment: 'Apartamento',
  camp_site: 'Camping',
  caravan_site: 'Zona de caravanas',
  attraction: 'Atracción',
  viewpoint: 'Mirador',
  zoo: 'Zoológico',
  theme_park: 'Parque temático',
  sports_centre: 'Centro deportivo',
  fitness_centre: 'Gimnasio',
  stadium: 'Estadio',
  pitch: 'Campo deportivo',
  playground: 'Parque infantil',
  golf_course: 'Campo de golf',
  swimming_pool: 'Piscina',
  // Vías y transporte
  motorway: 'Autopista',
  trunk: 'Autovía',
  primary: 'Carretera principal',
  secondary: 'Carretera',
  tertiary: 'Carretera',
  residential: 'Calle',
  service: 'Vía de servicio',
  pedestrian: 'Zona peatonal',
  footway: 'Camino peatonal',
  cycleway: 'Carril bici',
  path: 'Sendero',
  living_street: 'Calle residencial',
  station: 'Estación',
  halt: 'Apeadero',
  tram_stop: 'Parada de tranvía',
  subway_entrance: 'Entrada de metro',
  // Edificaciones y zonas
  building: 'Edificio',
  apartments: 'Edificios',
  commercial: 'Edificio comercial',
  industrial: 'Polígono industrial',
  retail: 'Zona comercial',
  farmland: 'Cultivos',
  grass: 'Zona verde',
  administrative: 'Zona administrativa',
  // Monumentos
  monument: 'Monumento',
  memorial: 'Memorial',
  castle: 'Castillo',
  ruins: 'Ruinas',
  church: 'Iglesia',
};

const KIND_BY_KEY: Record<string, string> = {
  'highway:residential': 'Calle',
  'landuse:residential': 'Zona residencial',
  'place:locality': 'Localidad',
  'place:city': 'Ciudad',
  'place:town': 'Villa',
  'place:village': 'Pueblo',
  'place:hamlet': 'Aldea',
  'shop:car': 'Concesionario',
  'shop:car_repair': 'Taller',
  'shop:car_parts': 'Recambios',
  'shop:fuel': 'Gasolinera',
  'amenity:fuel': 'Gasolinera',
  'amenity:parking': 'Parking',
  'boundary:administrative': 'Zona administrativa',
  'building:yes': 'Edificio',
  'building:house': 'Edificio',
};

const TYPE_LABELS: Record<string, string> = {
  house: 'Dirección',
  street: 'Calle',
  locality: 'Localidad',
  city: 'Ciudad',
  district: 'Distrito',
  other: 'Lugar',
};

const SPANISH_REGIONS =
  typeof Intl.DisplayNames === 'undefined'
    ? null
    : new Intl.DisplayNames(['es'], { type: 'region' });

@Injectable({ providedIn: 'root' })
export class PlaceSearchService {
  private readonly http = inject(HttpClient);
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
    const fallback = properties.city ?? properties.district ?? country ?? 'Lugar';
    const name = this.clean(properties.name) ?? this.clean(street) ?? fallback;
    // No usamos `state`: Photon a veces devuelve el nombre administrativo
    // en un idioma inesperado (p. ej. "Katalonien"). Ciudad + país bastan
    // para identificar la ubicación y el país se muestra en español.
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
    if (normalized && SPANISH_REGIONS) {
      const translated = SPANISH_REGIONS.of(normalized);
      if (translated) {
        return translated;
      }
    }
    return this.clean(fallback);
  }

  private kindLabel(properties: PhotonFeature['properties']): string {
    const keyed = KIND_BY_KEY[`${properties.osm_key ?? ''}:${properties.osm_value ?? ''}`];
    if (keyed) {
      return keyed;
    }
    const direct = KIND_LABELS[properties.osm_value ?? ''];
    if (direct) {
      return direct;
    }
    return TYPE_LABELS[properties.type ?? ''] ?? 'Lugar';
  }
}
