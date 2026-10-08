import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: 'admin' | 'user' | 'technician';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<AuthUser | null>(this.readStoredUser());

  constructor(private http: HttpClient) {}

  private readStoredUser(): AuthUser | null {
    const raw = sessionStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }

  register(fullName: string, email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, { fullName, email, password });
  }

  login(email: string, password: string): Observable<{ token: string; user: AuthUser }> {
    return this.http.post<{ token: string; user: AuthUser }>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => {
        sessionStorage.setItem('auth_token', res.token);
        sessionStorage.setItem('auth_user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout() {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    this.currentUser.set(null);
  }

  get token(): string | null {
    return sessionStorage.getItem('auth_token');
  }
}
