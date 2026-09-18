import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { TechnicianDashboardComponent } from './pages/technician-dashboard/technician-dashboard.component';
import { EquipmentCrudComponent } from './pages/equipment-crud/equipment-crud.component';
import { CertificateIssueComponent } from './pages/certificate-issue/certificate-issue.component';
import { TrackingComponent } from './pages/tracking/tracking.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: UserDashboardComponent, canActivate: [authGuard], data: { roles: ['user'] } },
  { path: 'technician', component: TechnicianDashboardComponent, canActivate: [authGuard], data: { roles: ['technician'] } },
  { path: 'equipment', component: EquipmentCrudComponent, canActivate: [authGuard], data: { roles: ['technician', 'admin'] } },
  { path: 'certificates/issue/:id', component: CertificateIssueComponent, canActivate: [authGuard], data: { roles: ['technician'] } },
  { path: 'tracking', component: TrackingComponent, canActivate: [authGuard] },
];