import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Renders a schematic line-art sketch for one of the 12 trained equipment
 * types, with a highlighted callout pointing at where the reading comes from.
 * Keys must match backend/src/config/equipment-type-guides.js `sketchKey`.
 *
 * This is a deliberate design choice: a literal interactive 3D model isn't
 * feasible to generate here (no 3D assets exist for these instruments), so
 * this labeled schematic does the same job — showing exactly where and what
 * to read — using only inline SVG.
 */
@Component({
  selector: 'app-equipment-sketch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;background:var(--color-surface-raised);border-radius:6px;">
      <g [ngSwitch]="sketchKey">

        <!-- THERMOMETER -->
        <g *ngSwitchCase="'thermometer'">
          <rect x="150" y="30" width="10" height="110" rx="5" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <circle cx="155" cy="150" r="16" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <circle cx="155" cy="150" r="9" [attr.fill]="accent"/>
          <rect x="152" y="60" width="6" height="80" [attr.fill]="accent"/>
          <rect x="190" y="60" width="90" height="34" rx="4" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="235" y="81" text-anchor="middle" [attr.fill]="accent" font-size="13" font-family="monospace">°C</text>
          <line x1="190" y1="77" x2="165" y2="70" [attr.stroke]="accent" stroke-width="1.5"/>
        </g>

        <!-- ANEMOMETER -->
        <g *ngSwitchCase="'anemometer'">
          <line x1="160" y1="80" x2="160" y2="150" stroke="#8b96a5" stroke-width="3"/>
          <circle cx="160" cy="70" r="4" fill="#8b96a5"/>
          <g stroke="#8b96a5" stroke-width="2" fill="none">
            <path d="M160,70 Q185,55 195,80 Q175,85 160,70"/>
            <path d="M160,70 Q140,50 120,65 Q140,80 160,70"/>
            <path d="M160,70 Q160,40 185,45 Q175,65 160,70"/>
          </g>
          <rect x="195" y="130" width="90" height="34" rx="4" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="240" y="151" text-anchor="middle" [attr.fill]="accent" font-size="12" font-family="monospace">m/s</text>
          <line x1="195" y1="147" x2="165" y2="140" [attr.stroke]="accent" stroke-width="1.5"/>
        </g>

        <!-- PIPETTE -->
        <g *ngSwitchCase="'pipette'">
          <rect x="145" y="30" width="24" height="60" rx="4" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <path d="M149,90 L165,90 L160,150 L154,150 Z" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <rect x="150" y="42" width="14" height="18" rx="2" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="200" y="53" [attr.fill]="accent" font-size="12" font-family="monospace">µL window</text>
          <line x1="164" y1="51" x2="195" y2="51" [attr.stroke]="accent" stroke-width="1.5"/>
        </g>

        <!-- SOUND LEVEL METER -->
        <g *ngSwitchCase="'sound_level_meter'">
          <rect x="140" y="50" width="40" height="100" rx="5" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <circle cx="160" cy="45" r="9" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <rect x="147" y="70" width="26" height="20" rx="2" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="220" y="83" [attr.fill]="accent" font-size="12" font-family="monospace">dB display</text>
          <line x1="173" y1="80" x2="205" y2="80" [attr.stroke]="accent" stroke-width="1.5"/>
        </g>

        <!-- TORQUE WRENCH -->
        <g *ngSwitchCase="'torque_wrench'">
          <path d="M60,150 L200,110" stroke="#8b96a5" stroke-width="6" stroke-linecap="round" fill="none"/>
          <circle cx="220" cy="103" r="20" fill="none" stroke="#8b96a5" stroke-width="3"/>
          <rect x="95" y="118" width="34" height="16" rx="2" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3" transform="rotate(-16 112 126)"/>
          <text x="55" y="90" [attr.fill]="accent" font-size="12" font-family="monospace">N·m scale</text>
          <line x1="100" y1="118" x2="90" y2="98" [attr.stroke]="accent" stroke-width="1.5"/>
        </g>

        <!-- HUMIDITY SENSOR -->
        <g *ngSwitchCase="'humidity_sensor'">
          <rect x="130" y="40" width="60" height="90" rx="6" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <line x1="160" y1="130" x2="160" y2="165" stroke="#8b96a5" stroke-width="3"/>
          <rect x="138" y="55" width="44" height="24" rx="2" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="215" y="70" [attr.fill]="accent" font-size="12" font-family="monospace">%RH</text>
          <line x1="182" y1="67" x2="205" y2="67" [attr.stroke]="accent" stroke-width="1.5"/>
        </g>

        <!-- VERNIER CALIPER -->
        <g *ngSwitchCase="'vernier_caliper'">
          <rect x="40" y="90" width="220" height="10" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <path d="M50,90 L50,70 L60,90" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <path d="M180,100 L180,120 L190,100" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <rect x="150" y="100" width="60" height="26" rx="2" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="180" y="118" text-anchor="middle" [attr.fill]="accent" font-size="11" font-family="monospace">mm</text>
          <line x1="180" y1="100" x2="180" y2="105" [attr.stroke]="accent" stroke-width="1.5"/>
        </g>

        <!-- MICROMETER -->
        <g *ngSwitchCase="'micrometer'">
          <path d="M70,60 Q40,110 70,160" fill="none" stroke="#8b96a5" stroke-width="4"/>
          <line x1="70" y1="95" x2="200" y2="95" stroke="#8b96a5" stroke-width="4"/>
          <line x1="70" y1="125" x2="140" y2="125" stroke="#8b96a5" stroke-width="4"/>
          <rect x="150" y="108" width="60" height="26" rx="2" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="180" y="126" text-anchor="middle" [attr.fill]="accent" font-size="11" font-family="monospace">mm</text>
        </g>

        <!-- PRESSURE GAUGE -->
        <g *ngSwitchCase="'pressure_gauge'">
          <circle cx="160" cy="100" r="55" fill="none" [attr.stroke]="accent" stroke-width="2" stroke-dasharray="3 3"/>
          <line x1="160" y1="100" x2="185" y2="75" stroke="#8b96a5" stroke-width="3"/>
          <circle cx="160" cy="100" r="4" fill="#8b96a5"/>
          <text x="160" y="175" text-anchor="middle" [attr.fill]="accent" font-size="12" font-family="monospace">bar</text>
          <line x1="160" y1="155" x2="160" y2="165" [attr.stroke]="accent" stroke-width="1.5"/>
        </g>

        <!-- FLOW METER -->
        <g *ngSwitchCase="'flow_meter'">
          <line x1="40" y1="100" x2="260" y2="100" stroke="#8b96a5" stroke-width="10"/>
          <circle cx="160" cy="100" r="30" fill="var(--color-surface-raised)" stroke="#8b96a5" stroke-width="2"/>
          <rect x="140" y="90" width="40" height="20" rx="2" [attr.stroke]="accent" fill="var(--color-surface-raised)" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="160" y="105" text-anchor="middle" [attr.fill]="accent" font-size="10" font-family="monospace">L/min</text>
        </g>

        <!-- DIGITAL SCALE -->
        <g *ngSwitchCase="'digital_scale'">
          <rect x="90" y="120" width="140" height="14" rx="3" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <rect x="130" y="70" width="60" height="50" rx="4" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <rect x="138" y="80" width="44" height="22" rx="2" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="160" y="96" text-anchor="middle" [attr.fill]="accent" font-size="11" font-family="monospace">g</text>
        </g>

        <!-- PH METER -->
        <g *ngSwitchCase="'ph_meter'">
          <rect x="140" y="35" width="40" height="70" rx="4" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <line x1="160" y1="105" x2="160" y2="150" stroke="#8b96a5" stroke-width="3"/>
          <path d="M150,150 L170,150 L160,170 Z" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <rect x="146" y="45" width="28" height="24" rx="2" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="215" y="60" [attr.fill]="accent" font-size="12" font-family="monospace">pH</text>
          <line x1="174" y1="57" x2="200" y2="57" [attr.stroke]="accent" stroke-width="1.5"/>
        </g>

        <!-- fallback -->
        <g *ngSwitchDefault>
          <rect x="120" y="60" width="80" height="80" rx="6" fill="none" stroke="#8b96a5" stroke-width="2"/>
          <rect x="135" y="80" width="50" height="24" rx="2" [attr.stroke]="accent" fill="none" stroke-width="2" stroke-dasharray="3 3"/>
        </g>
      </g>

      <text x="160" y="205" text-anchor="middle" fill="#8b96a5" font-size="11">enter the reading from the highlighted display</text>
    </svg>
  `,
})
export class EquipmentSketchComponent {
  @Input() sketchKey = '';
  accent = '#ff8a3d';
}
