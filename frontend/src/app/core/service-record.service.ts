import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, defer, from, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { dateShort, generateId, isNetworkError } from './format';
import type { PartItem, ServiceRecord, ServiceRecordInput } from './models';
import { ConnectivityService } from './connectivity.service';
import { OfflineQueueService } from './offline-queue.service';
import { VehicleStore } from './vehicle-store.service';

@Injectable({ providedIn: 'root' })
export class ServiceRecordService {
  private readonly http = inject(HttpClient);
  private readonly connectivity = inject(ConnectivityService);
  private readonly queue = inject(OfflineQueueService);
  private readonly store = inject(VehicleStore);
  private readonly base = `${environment.apiUrl}/vehicles`;

  list(vehicleId: number): Observable<ServiceRecord[]> {
    return this.http.get<ServiceRecord[]>(`${this.base}/${vehicleId}/service-records`);
  }

  create(vehicleId: number, input: ServiceRecordInput): Observable<ServiceRecord> {
    return defer(() => {
      const clientMutationId = generateId();
      const url = `${this.base}/${vehicleId}/service-records`;
      const body = { ...input, clientMutationId };
      const preview = this.buildPreview(input);

      const enqueue = () =>
        from(
          this.queue.enqueue({
            id: clientMutationId,
            kind: 'service',
            vehicleId,
            url,
            body,
            preview,
            label: `${input.title} · ${dateShort(input.date)}`,
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

      return this.http.post<ServiceRecord>(url, body).pipe(
        map((record) => {
          this.store.updateOdometer(vehicleId, input.odometer);
          return record;
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

  private buildPreview(input: ServiceRecordInput): ServiceRecord {
    const parts: PartItem[] = input.parts.map((part) => ({
      id: undefined,
      partName: part.partName,
      oemReference: part.oemReference ?? null,
      brand: part.brand ?? null,
      quantity: part.quantity,
      unitPrice: part.unitPrice,
      lineTotal: Number((part.quantity * part.unitPrice).toFixed(2)),
    }));
    const partsCost = Number(parts.reduce((sum, part) => sum + (part.lineTotal ?? 0), 0).toFixed(2));
    const totalCost = input.totalCost ?? Number((input.laborCost + partsCost).toFixed(2));
    return {
      id: -Date.now(),
      date: input.date,
      odometer: input.odometer,
      category: input.category,
      title: input.title,
      ruleId: input.ruleId ?? null,
      totalCost,
      laborCost: input.laborCost,
      partsCost,
      performedBy: input.performedBy,
      notes: input.notes ?? null,
      invoiceFilePath: input.invoiceFilePath ?? null,
      parts,
      createdAt: new Date().toISOString(),
      pending: true,
    };
  }
}
