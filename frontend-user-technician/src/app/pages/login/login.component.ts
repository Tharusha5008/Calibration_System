import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="card" style="max-width:380px;margin:3rem auto;">
      <h2 style="margin-top:0;">Sign in</h2>
      <form (ngSubmit)="submit()">
        <label>Email</label>
        <input type="email" [(ngModel)]="email" name="email" required style="margin:0.35rem 0 1rem;" />
        <label>Password</label>
        <input type="password" [(ngModel)]="password" name="password" required style="margin:0.35rem 0 1rem;" />
        <p *ngIf="error" style="color:var(--color-fail);font-size:0.9rem;">{{ error }}</p>
        <button class="btn" type="submit" style="width:100%;">Sign in</button>
      </form>
      <p style="margin-top:1rem;font-size:0.9rem;color:var(--color-text-muted);">
        No account? <a routerLink="/register" style="color:var(--color-accent);">Register</a>
      </p>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.user.role === 'technician') this.router.navigate(['/technician']);
        else if (res.user.role === 'user') this.router.navigate(['/dashboard']);
        else this.router.navigate(['/']);
      },
      error: (err) => (this.error = err.error?.message || 'Login failed'),
    });
  }
}
