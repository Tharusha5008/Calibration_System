import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments';

@Injectable({ providedIn: 'root' })
export class CalibrationService {
  constructor(private http: HttpClient) {}

  predict(payload: any): Observable<{ predicted_error_pct: number; needs_calibration: boolean; margin_pct: number }> {
    return this.http.post<any>(`${environment.apiUrl}/ai/predict`, payload);
  }

  createRequest(payload: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/calibration-requests`, payload);
  }

  list(params: { status?: string; mine?: boolean } = {}): Observable<{ requests: any[] }> {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.mine) qs.set('mine', 'true');
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.http.get<{ requests: any[] }>(`${environment.apiUrl}/calibration-requests${query}`);
  }

  track(token: string): Observable<{ request: any }> {
    return this.http.get<{ request: any }>(`${environment.apiUrl}/calibration-requests/track/${token}`);
  }

  accept(id: number) { return this.http.post(`${environment.apiUrl}/calibration-requests/${id}/accept`, {}); }
  handover(id: number) { return this.http.post(`${environment.apiUrl}/calibration-requests/${id}/handover`, {}); }
  start(id: number) { return this.http.post(`${environment.apiUrl}/calibration-requests/${id}/start`, {}); }
  release(id: number) { return this.http.post(`${environment.apiUrl}/calibration-requests/${id}/release`, {}); }

  issueCertificate(payload: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/certificates`, payload);
  }
}
