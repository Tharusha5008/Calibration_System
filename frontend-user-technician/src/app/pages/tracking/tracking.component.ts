import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CalibrationService } from '../../services/calibration.service';

const STAGE_LABELS: Record<string, string> = {
  token_booked: 'Token booked',
  technician_accepted: 'Technician accepted',
  equipment_handed_over: 'Handed over to technician',
  calibration_in_progress: 'Calibration in progress',
  calibrated_released: 'Calibrated & released',
  certificate_pending_approval: 'Certificate pending approval',
  certificate_approved: 'Certificate approved',
  certificate_rejected: 'Certificate rejected',
  closed: 'Closed',
};

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card" style="max-width:560px;margin:0 auto;">
      <h2 style="margin-top:0;">Track a request</h2>
      <div style="display:flex;gap:0.6rem;">
        <input [(ngModel)]="token" placeholder="e.g. CAL-20260727-0001" />
        <button class="btn" (click)="search()">Track</button>
      </div>

      <p *ngIf="error" style="color:var(--color-fail);margin-top:0.75rem;">{{ error }}</p>

      <div *ngIf="request" style="margin-top:1.5rem;">
        <div class="token" style="font-size:1.1rem;">{{ request.tracking_token }}</div>
        <div style="color:var(--color-text-muted);margin-bottom:1rem;">{{ request.equipment_type }}</div>

        <div *ngFor="let entry of request.status_history" style="display:flex;gap:0.75rem;margin-bottom:0.75rem;align-items:flex-start;">
          <div style="width:10px;height:10px;border-radius:50%;background:var(--color-accent);margin-top:0.35rem;flex-shrink:0;"></div>
          <div>
            <div>{{ stageLabels[entry.status] || entry.status }}</div>
            <div style="color:var(--color-text-muted);font-size:0.8rem;">{{ entry.at | date:'medium' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TrackingComponent implements OnInit {
  token = '';
  request: any = null;
  error = '';
  stageLabels = STAGE_LABELS;

  constructor(private route: ActivatedRoute, private calSvc: CalibrationService) {}

  ngOnInit() {
    const qToken = this.route.snapshot.queryParamMap.get('token');
    if (qToken) { this.token = qToken; this.search(); }
  }

  search() {
    this.error = '';
    this.calSvc.track(this.token).subscribe({
      next: (res) => (this.request = res.request),
      error: (err) => { this.error = err.error?.message || 'Not found'; this.request = null; },
    });
  }
}
