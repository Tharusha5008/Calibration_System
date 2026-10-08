import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CalibrationService } from '../../services/calibration.service';

@Component({
  selector: 'app-certificate-issue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card" style="max-width:520px;margin:0 auto;">
      <h2 style="margin-top:0;">Issue certificate</h2>
      <label>Final measured value</label>
      <input type="number" [(ngModel)]="finalMeasuredValue" style="margin:0.35rem 0 1rem;" />
      <label>Final error %</label>
      <input type="number" [(ngModel)]="finalErrorPct" style="margin:0.35rem 0 1rem;" />
      <label>Result</label>
      <select [(ngModel)]="result" style="margin:0.35rem 0 1rem;">
        <option value="PASS">PASS</option>
        <option value="ADJUSTED">ADJUSTED</option>
        <option value="FAIL">FAIL</option>
      </select>
      <label>Remarks</label>
      <textarea [(ngModel)]="remarks" rows="3" style="margin:0.35rem 0 1rem;"></textarea>

      <button class="btn" (click)="submit()" [disabled]="submitting">
        {{ submitting ? 'Submitting...' : 'Send for admin approval' }}
      </button>
      <p *ngIf="message" style="margin-top:0.75rem;color:var(--color-pass);">{{ message }}</p>
    </div>
  `,
})
export class CertificateIssueComponent implements OnInit {
  calibrationRequestId!: number;
  finalMeasuredValue: number | null = null;
  finalErrorPct: number | null = null;
  result = 'PASS';
  remarks = '';
  submitting = false;
  message = '';

  constructor(private route: ActivatedRoute, private router: Router, private calSvc: CalibrationService) {}

  ngOnInit() {
    this.calibrationRequestId = Number(this.route.snapshot.paramMap.get('id'));
  }

  submit() {
    this.submitting = true;
    this.calSvc.issueCertificate({
      calibrationRequestId: this.calibrationRequestId,
      finalMeasuredValue: this.finalMeasuredValue,
      finalErrorPct: this.finalErrorPct,
      result: this.result,
      remarks: this.remarks,
    }).subscribe({
      next: () => {
        this.message = 'Certificate submitted — awaiting admin approval.';
        this.submitting = false;
        setTimeout(() => this.router.navigate(['/technician']), 1200);
      },
      error: () => (this.submitting = false),
    });
  }
}
