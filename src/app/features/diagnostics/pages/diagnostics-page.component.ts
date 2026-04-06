import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { WebGpuCapabilityService } from '../../../core/platform/webgpu-capability.service';

@Component({
  selector: 'app-diagnostics-page',
  standalone: true,
  template: `
    <section class="panel">
      <p class="eyebrow">Diagnostics</p>
      <h2>Browser capability check</h2>

      <dl>
        <div>
          <dt>WebGPU</dt>
          <dd>{{ supported ? 'available' : 'missing' }}</dd>
        </div>
        <div>
          <dt>Adapter</dt>
          <dd>{{ adapterName || 'not detected' }}</dd>
        </div>
      </dl>
    </section>
  `,
  styles: [
    `
      .panel {
        max-width: 700px;
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        background: var(--surface);
        box-shadow: var(--shadow);
      }

      .eyebrow {
        margin: 0 0 8px;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.72rem;
        font-weight: 700;
      }

      h2 {
        margin: 0 0 24px;
      }

      dl {
        display: grid;
        gap: 14px;
      }

      div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
      }

      dd {
        margin: 0;
        font-weight: 700;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiagnosticsPageComponent implements OnInit {
  private readonly webGpuCapabilityService = inject(WebGpuCapabilityService);

  supported = false;
  adapterName: string | null = null;

  async ngOnInit(): Promise<void> {
    const result = await this.webGpuCapabilityService.inspect();
    this.supported = result.supported;
    this.adapterName = result.adapterName;
  }
}
