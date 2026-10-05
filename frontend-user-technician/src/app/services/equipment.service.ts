import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  constructor(private http: HttpClient) {}

  // One row per equipment type — this alone is the picker's data source now.
  list(): Observable<{ equipment: any[] }> {
    return this.http.get<{ equipment: any[] }>(`${environment.apiUrl}/equipment`);
  }

  create(payload: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/equipment`, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/equipment/${id}`, payload);
  }

  remove(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/equipment/${id}`);
  }
}
