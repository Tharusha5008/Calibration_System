import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="card" style="max-width:400px;margin:3rem auto;">
      <h2 style="margin-top:0;">Create your account</h2>
      <form (ngSubmit)="submit()">
        <label>Full name</label>
        <input [(ngModel)]="fullName" name="fullName" required style="margin:0.35rem 0 1rem;" />
        <label>Email</label>
        <input type="email" [(ngModel)]="email" name="email" required style="margin:0.35rem 0 1rem;" />
        <label>Password (min 8 characters)</label>
        <input type="password" [(ngModel)]="password" name="password" required minlength="8" style="margin:0.35rem 0 1rem;" />
        <p *ngIf="error" style="color:var(--color-fail);font-size:0.9rem;">{{ error }}</p>
        <p *ngIf="success" style="color:var(--color-pass);font-size:0.9rem;">{{ success }}</p>
        <button class="btn" type="submit" style="width:100%;">Register</button>
      </form>
      <p style="margin-top:1rem;font-size:0.9rem;color:var(--color-text-muted);">
        Already have an account? <a routerLink="/login" style="color:var(--color-accent);">Sign in</a>
      </p>
    </div>
  `,
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.auth.register(this.fullName, this.email, this.password).subscribe({
      next: () => {
        this.success = 'Account created — signing you in...';
        this.auth.login(this.email, this.password).subscribe(() => this.router.navigate(['/dashboard']));
      },
      error: (err) => (this.error = err.error?.message || 'Registration failed'),
    });
  }
}
