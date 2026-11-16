import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, defer, from, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { dateShort, generateId, isNetworkError } from './format';
import type { FuelLog, FuelLogInput } from './models';
import { ConnectivityService } from './connectivity.service';
import { I18nService } from './i18n.service';
import { OfflineQueueService } from './offline-queue.service';
import { VehicleStore } from './vehicle-store.service';

@Injectable({ providedIn: 'root' })
export class FuelService {
  private readonly http = inject(HttpClient);
  private readonly connectivity = inject(ConnectivityService);
  private readonly i18n = inject(I18nService);
  private readonly queue = inject(OfflineQueueService);
  private readonly store = inject(VehicleStore);
  private readonly base = `${environment.apiUrl}/vehicles`;

  list(vehicleId: number): Observable<FuelLog[]> {
    return this.http.get<FuelLog[]>(`${this.base}/${vehicleId}/fuel-logs`);
  }

  create(vehicleId: number, input: FuelLogInput): Observable<FuelLog> {
    return defer(() => {
      const clientMutationId = generateId();
      const url = `${this.base}/${vehicleId}/fuel-logs`;
      const body = { ...input, clientMutationId };
      const preview = this.buildPreview(input);

      const enqueue = () =>
        from(
          this.queue.enqueue({
            id: clientMutationId,
            kind: 'fuel',
            vehicleId,
            url,
            body,
            preview,
            label: `${this.i18n.t('queue.fuelLabel')} · ${dateShort(input.date)}`,
          }),
        ).pipe(
          map(() => {
            this.store.updateOdometer(vehicleId, input.odometer);
            return preview;
          }),
        );

      if (!this.connectivity.online()) {
        return enqueue();
      }

      return this.http.post<FuelLog>(url, body).pipe(
        map((log) => {
          this.store.updateOdometer(vehicleId, input.odometer);
          return log;
        }),
        catchError((error: unknown) => {
          if (isNetworkError(error)) {
            return enqueue();
          }
          return throwError(() => error);
        }),
      );
    });
  }

  private buildPreview(input: FuelLogInput): FuelLog {
    const liters = Number(input.liters);
    const pricePerLiter = Number(input.pricePerLiter);
    const totalCost = input.totalCost ?? pricePerLiter * liters;
    return {
      id: -Date.now(),
      date: input.date,
      odometer: input.odometer,
      liters: Number(liters.toFixed(3)),
      pricePerLiter: Number(pricePerLiter.toFixed(3)),
      totalCost: Number(totalCost.toFixed(2)),
      stationName: input.stationName ?? null,
      stationLocation: input.stationLocation ?? null,
      fullTank: input.fullTank,
      boardComputerAvg: input.boardComputerAvg ?? null,
      consumption: null,
      savings: null,
      createdAt: new Date().toISOString(),
      pending: true,
    };
  }
}
