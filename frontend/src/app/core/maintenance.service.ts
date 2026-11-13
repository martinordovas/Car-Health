import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { MaintenanceRule } from './models';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/vehicles`;

  list(vehicleId: number): Observable<MaintenanceRule[]> {
    return this.http.get<MaintenanceRule[]>(`${this.base}/${vehicleId}/maintenance-rules`);
  }
}
