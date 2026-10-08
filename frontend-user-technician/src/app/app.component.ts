import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <header *ngIf="auth.currentUser() as user" style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;border-bottom:1px solid var(--color-border);">
      <div style="font-weight:700;letter-spacing:0.02em;">CALIBRATE<span style="color:var(--color-accent)">.</span>OS</div>
      <nav style="display:flex;gap:1.25rem;align-items:center;">
        <a routerLink="/tracking" style="color:var(--color-text-muted);text-decoration:none;">Track</a>
        <a *ngIf="user.role === 'user'" routerLink="/dashboard" style="color:var(--color-text-muted);text-decoration:none;">My Requests</a>
        <a *ngIf="user.role === 'technician'" routerLink="/technician" style="color:var(--color-text-muted);text-decoration:none;">Technician Board</a>
        <a *ngIf="user.role === 'technician'" routerLink="/equipment" style="color:var(--color-text-muted);text-decoration:none;">Equipment</a>
        <span style="color:var(--color-text-muted);font-size:0.85rem;">{{ user.fullName }} · {{ user.role }}</span>
        <button class="btn secondary" (click)="logout()">Logout</button>
      </nav>
    </header>
    <main style="max-width:1100px;margin:0 auto;padding:1.5rem;">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {}
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
