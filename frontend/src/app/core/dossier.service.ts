import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DossierService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/vehicles`;

  download(vehicleId: number, plate?: string | null): Observable<Blob> {
    return this.http
      .get(`${this.base}/${vehicleId}/dossier.pdf`, { responseType: 'blob' })
      .pipe(tap((blob) => this.save(blob, plate)));
  }

  private save(blob: Blob, plate?: string | null): void {
    const suffix = plate ? plate.replace(/[^a-zA-Z0-9]/g, '') : 'vehiculo';
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `carhealth-dossier-${suffix}.pdf`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
