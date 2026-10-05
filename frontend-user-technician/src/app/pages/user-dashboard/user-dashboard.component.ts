import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EquipmentService } from '../../services/equipment.service';
import { CalibrationService } from '../../services/calibration.service';
import { EquipmentSketchComponent } from '../../components/equipment-sketch.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EquipmentSketchComponent],
  template: `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
      <div class="card">
        <h2 style="margin-top:0;">Check equipment</h2>

        <!-- One entry per equipment TYPE — nothing repeated -->
        <label>Equipment</label>
        <select [(ngModel)]="selectedEquipmentId" (ngModelChange)="onEquipmentChange()" style="margin:0.35rem 0 1rem;">
          <option [ngValue]="null">Select equipment...</option>
          <option *ngFor="let eq of equipmentList" [ngValue]="eq.id">{{ eq.guide?.label || eq.equipment_type }}</option>
        </select>

        <!-- Sketch + guidance panel: shown as soon as equipment is picked -->
        <div *ngIf="selectedEquipment" class="card" style="background:var(--color-surface-raised);margin-bottom:1rem;">
          <app-equipment-sketch [sketchKey]="selectedEquipment.guide?.sketchKey || selectedEquipment.equipment_type"></app-equipment-sketch>
          <div style="font-weight:600;margin:0.75rem 0 0.35rem;">{{ selectedEquipment.guide?.measurementLabel }} ({{ selectedEquipment.unit }})</div>
          <div style="color:var(--color-text-muted);font-size:0.9rem;">{{ selectedEquipment.guide?.instructions }}</div>
          <div style="color:var(--color-text-muted);font-size:0.8rem;margin-top:0.5rem;">
            Standard: {{ selectedEquipment.standard_reference }} · Nominal: {{ selectedEquipment.nominal_value }} {{ selectedEquipment.unit }} · MPE tolerance: ±{{ selectedEquipment.mpe_tolerance }} {{ selectedEquipment.unit }}
          </div>
        </div>

        <div *ngIf="selectedEquipment">
          <label>{{ selectedEquipment.guide?.measurementLabel || 'Measured value' }} ({{ selectedEquipment.unit }})</label>
          <input type="number" [(ngModel)]="measuredValue" step="0.0001" style="margin:0.35rem 0 1rem;" />

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div>
              <label>Usage hours since last cal — optional</label>
              <input type="number" [(ngModel)]="usageHoursSinceLastCal" placeholder="e.g. 500" style="margin:0.35rem 0 1rem;" />
            </div>
            <div>
              <label>Ambient temp (°C) — optional</label>
              <input type="number" [(ngModel)]="ambientTemperatureC" placeholder="defaults to 22" style="margin:0.35rem 0 1rem;" />
            </div>
          </div>
          <label>Ambient humidity (%) — optional</label>
          <input type="number" [(ngModel)]="ambientHumidityPct" placeholder="defaults to 45" style="margin:0.35rem 0 1rem;" />

          <button class="btn" (click)="runPrediction()" [disabled]="measuredValue === null || loading">
            {{ loading ? 'Predicting...' : 'Check calibration' }}
          </button>
        </div>

        <p *ngIf="predictError" style="color:var(--color-fail);margin-top:0.75rem;">{{ predictError }}</p>
      </div>

      <div class="card" *ngIf="predictionResult as result">
        <h2 style="margin-top:0;">Result</h2>
        <p style="font-size:2rem;margin:0;font-family:var(--font-mono);">{{ result.predicted_error_pct }}%</p>
        <p style="color:var(--color-text-muted);">of the allowed tolerance used (100% = at the limit)</p>

        <div style="margin:1rem 0;">
          <span class="badge" [class.fail]="result.needs_calibration" [class.pass]="!result.needs_calibration">
            {{ result.needs_calibration ? 'Calibration required' : 'Within tolerance — no calibration needed' }}
          </span>
        </div>

        <button *ngIf="result.needs_calibration && !bookedToken" class="btn" (click)="bookToken()" [disabled]="booking">
          {{ booking ? 'Booking...' : 'Book calibration token' }}
        </button>

        <div *ngIf="bookedToken" class="card" style="margin-top:1rem;background:var(--color-surface-raised);">
          <p style="margin:0 0 0.5rem;">Your tracking token:</p>
          <p class="token" style="font-size:1.3rem;margin:0 0 0.75rem;">{{ bookedToken }}</p>
          <a routerLink="/tracking" [queryParams]="{ token: bookedToken }" class="btn secondary" style="text-decoration:none;display:inline-block;">Track this request</a>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:1.5rem;">
      <h2 style="margin-top:0;">My past requests</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="text-align:left;color:var(--color-text-muted);font-size:0.85rem;">
            <th style="padding:0.5rem;">Token</th><th>Equipment</th><th>Status</th><th>Predicted error</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of myRequests" style="border-top:1px solid var(--color-border);">
            <td style="padding:0.5rem;" class="token">{{ r.tracking_token }}</td>
            <td>{{ r.equipment_type }}</td>
            <td>{{ r.status }}</td>
            <td>{{ r.predicted_error_pct }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class UserDashboardComponent implements OnInit {
  equipmentList: any[] = [];
  selectedEquipmentId: number | null = null;
  selectedEquipment: any = null;

  measuredValue: number | null = null;
  usageHoursSinceLastCal: number | null = null;
  ambientTemperatureC: number | null = null;
  ambientHumidityPct: number | null = null;

  loading = false;
  booking = false;
  predictError = '';
  predictionResult: { predicted_error_pct: number; needs_calibration: boolean; margin_pct: number } | null = null;
  bookedToken: string | null = null;

  myRequests: any[] = [];

  constructor(private equipmentSvc: EquipmentService, private calSvc: CalibrationService) {}

  ngOnInit() {
    this.equipmentSvc.list().subscribe((res) => (this.equipmentList = res.equipment));
    this.loadMyRequests();
  }

  onEquipmentChange() {
    this.selectedEquipment = this.equipmentList.find((e) => e.id === this.selectedEquipmentId) || null;
    this.predictionResult = null;
    this.bookedToken = null;
  }

  runPrediction() {
    if (!this.selectedEquipment) return;
    this.loading = true;
    this.predictError = '';
    this.calSvc
      .predict({
        equipmentId: this.selectedEquipment.id,
        measuredValue: this.measuredValue,
        usageHoursSinceLastCal: this.usageHoursSinceLastCal,
        ambientTemperatureC: this.ambientTemperatureC,
        ambientHumidityPct: this.ambientHumidityPct,
      })
      .subscribe({
        next: (res: any) => {
          this.predictionResult = res;
          this.loading = false;
        },
        error: (err) => {
          this.predictError = err.error?.message || 'Prediction failed — is the AI service running & trained?';
          this.loading = false;
        },
      });
  }

  bookToken() {
    if (!this.selectedEquipment || !this.predictionResult) return;
    this.booking = true;
    this.calSvc
      .createRequest({
        equipmentId: this.selectedEquipment.id,
        measuredValue: this.measuredValue,
        usageHoursSinceLastCal: this.usageHoursSinceLastCal,
        ambientTemperatureC: this.ambientTemperatureC,
        ambientHumidityPct: this.ambientHumidityPct,
        predictedErrorPct: this.predictionResult.predicted_error_pct,
        needsCalibration: this.predictionResult.needs_calibration,
      })
      .subscribe({
        next: (res: any) => {
          this.bookedToken = res.request.tracking_token;
          this.booking = false;
          this.loadMyRequests();
        },
        error: () => (this.booking = false),
      });
  }

  loadMyRequests() {
    this.calSvc.list({ mine: true }).subscribe((res) => (this.myRequests = res.requests));
  }
}
