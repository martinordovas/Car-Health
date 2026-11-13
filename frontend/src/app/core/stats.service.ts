import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { VehicleStats } from './models';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/vehicles`;

  get(vehicleId: number): Observable<VehicleStats> {
    return this.http.get<VehicleStats>(`${this.base}/${vehicleId}/stats`);
  }
}
