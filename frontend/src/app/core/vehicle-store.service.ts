import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Vehicle, VehicleInput } from './models';
import { SessionService } from './session.service';

const SELECTED_KEY = 'ch-vehicle';

@Injectable({ providedIn: 'root' })
export class VehicleStore {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly base = `${environment.apiUrl}/vehicles`;

  private readonly vehiclesState = signal<Vehicle[]>([]);
  private readonly selectedIdState = signal<number | null>(this.readSelected());
  private request$: Observable<Vehicle[]> | null = null;

  readonly vehicles = this.vehiclesState.asReadonly();
  readonly selectedId = this.selectedIdState.asReadonly();
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly selected = computed(() => {
    const vehicles = this.vehiclesState();
    const id = this.selectedIdState();
    return vehicles.find((vehicle) => vehicle.id === id) ?? vehicles[0] ?? null;
  });
  readonly hasVehicles = computed(() => this.vehiclesState().length > 0);

  constructor() {
    effect(() => {
      if (!this.session.user()) {
        this.vehiclesState.set([]);
        this.loaded.set(false);
        this.error.set(null);
        this.selectedIdState.set(null);
      }
    });
  }

  load(force = false): Observable<Vehicle[]> {
    if (this.loaded() && !force) {
      return of(this.vehiclesState());
    }
    if (this.request$) {
      return this.request$;
    }
    this.loading.set(true);
    this.error.set(null);
    this.request$ = this.http.get<Vehicle[]>(this.base).pipe(
      tap((vehicles) => {
        this.vehiclesState.set(vehicles);
        const selected = this.selectedIdState();
        const exists = vehicles.some((vehicle) => vehicle.id === selected);
        if (!exists) {
          this.select(vehicles[0]?.id ?? null);
        }
        this.loaded.set(true);
      }),
      finalize(() => {
        this.loading.set(false);
        this.request$ = null;
      }),
      shareReplay(1),
    );
    return this.request$;
  }

  refresh(): void {
    this.load(true).subscribe({
      error: (error) => this.error.set(error?.message ?? 'No se pudo cargar el garaje.'),
    });
  }

  select(id: number | null): void {
    this.selectedIdState.set(id);
    try {
      if (id === null) {
        localStorage.removeItem(SELECTED_KEY);
      } else {
        localStorage.setItem(SELECTED_KEY, String(id));
      }
    } catch {
      // Ignorar.
    }
  }

  create(input: VehicleInput): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.base, input).pipe(
      tap((vehicle) => {
        this.vehiclesState.update((vehicles) => [...vehicles, vehicle]);
        this.select(vehicle.id);
        this.loaded.set(true);
      }),
    );
  }

  update(id: number, input: VehicleInput): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.base}/${id}`, input).pipe(
      tap((vehicle) => {
        this.vehiclesState.update((vehicles) =>
          vehicles.map((candidate) => (candidate.id === id ? vehicle : candidate)),
        );
      }),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        this.vehiclesState.update((vehicles) => vehicles.filter((vehicle) => vehicle.id !== id));
        if (this.selectedIdState() === id) {
          this.select(this.vehiclesState()[0]?.id ?? null);
        }
      }),
    );
  }

  updateOdometer(id: number, odometer: number): void {
    this.vehiclesState.update((vehicles) =>
      vehicles.map((vehicle) =>
        vehicle.id === id && odometer > vehicle.currentOdometer
          ? { ...vehicle, currentOdometer: odometer }
          : vehicle,
      ),
    );
  }

  private readSelected(): number | null {
    try {
      const raw = localStorage.getItem(SELECTED_KEY);
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  }
}
