import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Dashboard } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/vehicles`;

  get(vehicleId: number): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.base}/${vehicleId}/dashboard`);
  }
}
