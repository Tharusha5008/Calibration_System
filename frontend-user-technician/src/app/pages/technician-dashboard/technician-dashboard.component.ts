import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CalibrationService } from '../../services/calibration.service';

const STAGE_ORDER = [
  'token_booked',
  'technician_accepted',
  'equipment_handed_over',
  'calibration_in_progress',
  'calibrated_released',
  'certificate_pending_approval',
  'certificate_approved',
];

@Component({
  selector: 'app-technician-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <h2 style="margin:0;">Technician board</h2>
      <a routerLink="/equipment" class="btn secondary" style="text-decoration:none;">Manage equipment</a>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <h3 style="margin-top:0;">Available tokens (unassigned)</h3>
      <div *ngFor="let r of unassigned" class="card" style="background:var(--color-surface-raised);margin-bottom:0.6rem;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div class="token">{{ r.tracking_token }}</div>
          <div style="color:var(--color-text-muted);font-size:0.9rem;">{{ r.equipment_type }} · predicted error {{ r.predicted_error_pct }}%</div>
        </div>
        <button class="btn" (click)="accept(r)">Accept</button>
      </div>
      <p *ngIf="!unassigned.length" style="color:var(--color-text-muted);">No unassigned tokens right now.</p>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">My active jobs — shipment-style tracker</h3>
      <div *ngFor="let r of myJobs" class="card" style="background:var(--color-surface-raised);margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
          <div>
            <div class="token">{{ r.tracking_token }}</div>
            <div style="color:var(--color-text-muted);font-size:0.9rem;">{{ r.equipment_type }} ({{ r.standard_reference }})</div>
          </div>
          <span class="badge pending">{{ formatStatus(r.status) }}</span>
        </div>

        <!-- progress rail -->
        <div style="display:flex;gap:4px;margin-bottom:1rem;">
          <div *ngFor="let stage of stages" style="flex:1;height:6px;border-radius:3px;"
               [style.background]="stageIndex(r.status) >= stageIndex(stage) ? 'var(--color-accent)' : 'var(--color-border)'">
          </div>
        </div>

        <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
          <button class="btn secondary" *ngIf="r.status === 'technician_accepted'" (click)="handover(r)">Mark handed over</button>
          <button class="btn secondary" *ngIf="r.status === 'equipment_handed_over'" (click)="start(r)">Start calibration</button>
          <button class="btn secondary" *ngIf="r.status === 'calibration_in_progress'" (click)="release(r)">Calibrate & release</button>
          <a *ngIf="r.status === 'calibrated_released'" [routerLink]="['/certificates/issue', r.id]" class="btn" style="text-decoration:none;">Issue certificate</a>
        </div>
      </div>
      <p *ngIf="!myJobs.length" style="color:var(--color-text-muted);">No active jobs assigned to you.</p>
    </div>
  `,
})
export class TechnicianDashboardComponent implements OnInit {
  unassigned: any[] = [];
  myJobs: any[] = [];
  stages = STAGE_ORDER;

  constructor(private calSvc: CalibrationService) {}

  ngOnInit() { this.reload(); }

  reload() {
    this.calSvc.list({ status: 'token_booked' }).subscribe((res) => (this.unassigned = res.requests));
    this.calSvc.list({ mine: true }).subscribe((res) => (this.myJobs = res.requests.filter((r: any) => r.status !== 'token_booked' && !r.status.startsWith('certificate_') && r.status !== 'closed')));
  }

  stageIndex(status: string) { return STAGE_ORDER.indexOf(status); }
  formatStatus(status: string) { return status.replace(/_/g, ' '); }

  accept(r: any) { this.calSvc.accept(r.id).subscribe(() => this.reload()); }
  handover(r: any) { this.calSvc.handover(r.id).subscribe(() => this.reload()); }
  start(r: any) { this.calSvc.start(r.id).subscribe(() => this.reload()); }
  release(r: any) { this.calSvc.release(r.id).subscribe(() => this.reload()); }
}
