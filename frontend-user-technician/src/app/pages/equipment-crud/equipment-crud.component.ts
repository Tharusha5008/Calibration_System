import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentService } from '../../services/equipment.service';
import { EquipmentSketchComponent } from '../../components/equipment-sketch.component';

const KNOWN_TYPES = [
  'thermometer', 'anemometer', 'pipette', 'sound_level_meter', 'torque_wrench',
  'humidity_sensor', 'vernier_caliper', 'micrometer', 'pressure_gauge',
  'flow_meter', 'digital_scale', 'ph_meter',
];

@Component({
  selector: 'app-equipment-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, EquipmentSketchComponent],
  template: `
    <h2>Equipment catalog</h2>
    <p style="color:var(--color-text-muted);font-size:0.9rem;">
      One entry per trained equipment type. This organization's actual instrument spec —
      edit nominal value / MPE tolerance here if your real unit differs from the imported default.
    </p>

    <div class="card" style="margin-bottom:1.5rem;">
      <h3 style="margin-top:0;">{{ editingId ? 'Edit equipment' : 'Add equipment type' }}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div>
          <label>Equipment type</label>
          <select [(ngModel)]="form.equipmentType" name="equipmentType" [disabled]="!!editingId">
            <option [ngValue]="null">Select type...</option>
            <option *ngFor="let t of knownTypes" [ngValue]="t">{{ t }}</option>
          </select>
        </div>
        <div>
          <label>Standard reference</label>
          <input [(ngModel)]="form.standardReference" name="standardReference" placeholder="e.g. ISO 3611" />
        </div>
        <div>
          <label>Unit</label>
          <input [(ngModel)]="form.unit" name="unit" placeholder="e.g. mm" />
        </div>
        <div>
          <label>Instrument age (months)</label>
          <input type="number" [(ngModel)]="form.instrumentAgeMonths" name="instrumentAgeMonths" />
        </div>
        <div>
          <label>Nominal value</label>
          <input type="number" [(ngModel)]="form.nominalValue" name="nominalValue" />
        </div>
        <div>
          <label>MPE tolerance</label>
          <input type="number" [(ngModel)]="form.mpeTolerance" name="mpeTolerance" />
        </div>
      </div>
      <div style="margin-top:1rem;display:flex;gap:0.6rem;">
        <button class="btn" (click)="save()" [disabled]="!form.equipmentType">{{ editingId ? 'Update' : 'Create' }}</button>
        <button class="btn secondary" *ngIf="editingId" (click)="resetForm()">Cancel</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;">
      <div class="card" *ngFor="let eq of equipmentList">
        <app-equipment-sketch [sketchKey]="eq.guide?.sketchKey || eq.equipment_type"></app-equipment-sketch>
        <div style="font-weight:600;margin-top:0.6rem;">{{ eq.guide?.label || eq.equipment_type }}</div>
        <div style="color:var(--color-text-muted);font-size:0.85rem;">{{ eq.standard_reference }}</div>
        <div style="color:var(--color-text-muted);font-size:0.85rem;">Nominal {{ eq.nominal_value }} {{ eq.unit }} · ±{{ eq.mpe_tolerance }} {{ eq.unit }}</div>
        <div style="margin-top:0.6rem;display:flex;gap:0.5rem;">
          <button class="btn secondary" (click)="edit(eq)">Edit</button>
          <button class="btn danger" (click)="remove(eq)">Delete</button>
        </div>
      </div>
    </div>
  `,
})
export class EquipmentCrudComponent implements OnInit {
  equipmentList: any[] = [];
  editingId: number | null = null;
  knownTypes = KNOWN_TYPES;
  form: any = { equipmentType: null, standardReference: '', unit: '', nominalValue: null, mpeTolerance: null, instrumentAgeMonths: 12 };

  constructor(private equipmentSvc: EquipmentService) {}

  ngOnInit() { this.reload(); }
  reload() { this.equipmentSvc.list().subscribe((res) => (this.equipmentList = res.equipment)); }

  save() {
    if (this.editingId) {
      this.equipmentSvc.update(this.editingId, this.form).subscribe(() => { this.resetForm(); this.reload(); });
    } else {
      this.equipmentSvc.create(this.form).subscribe(() => { this.resetForm(); this.reload(); });
    }
  }

  edit(eq: any) {
    this.editingId = eq.id;
    this.form = {
      equipmentType: eq.equipment_type, standardReference: eq.standard_reference, unit: eq.unit,
      nominalValue: eq.nominal_value, mpeTolerance: eq.mpe_tolerance, instrumentAgeMonths: eq.instrument_age_months,
    };
  }

  remove(eq: any) { this.equipmentSvc.remove(eq.id).subscribe(() => this.reload()); }

  resetForm() {
    this.editingId = null;
    this.form = { equipmentType: null, standardReference: '', unit: '', nominalValue: null, mpeTolerance: null, instrumentAgeMonths: 12 };
  }
}
