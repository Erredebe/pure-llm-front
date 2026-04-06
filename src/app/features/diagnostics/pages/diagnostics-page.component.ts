import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { BrowserCapabilityService } from '../../../core/platform/browser-capability.service';
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
          <dt>Secure context</dt>
          <dd>{{ secureContext ? 'yes' : 'no' }}</dd>
        </div>
        <div>
          <dt>Adapter</dt>
          <dd>{{ adapterName || 'not detected' }}</dd>
        </div>
        <div>
          <dt>Device ready</dt>
          <dd>{{ deviceReady ? 'yes' : 'no' }}</dd>
        </div>
      </dl>

      @if (!deviceReady) {
        <section class="hint">
          <h3>Why local inference fails here</h3>
          <p>
            This app runs the model locally with WebLLM, so the browser must expose WebGPU in a secure context and
            successfully create a GPU device for compute pipelines.
          </p>
          @if (failureReason) {
            <p>
              Detected issue: <span>{{ failureReason }}</span>
            </p>
          }
          <p>
            Current browser: <span>{{ userAgent }}</span>
          </p>
        </section>
      }
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

      .hint {
        margin-top: 24px;
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.5);
      }

      .hint h3,
      .hint p {
        margin: 0;
      }

      .hint p + p {
        margin-top: 10px;
      }

      .hint span {
        word-break: break-word;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiagnosticsPageComponent implements OnInit {
  private readonly browserCapabilityService = inject(BrowserCapabilityService);
  private readonly webGpuCapabilityService = inject(WebGpuCapabilityService);

  supported = false;
  secureContext = false;
  adapterName: string | null = null;
  deviceReady = false;
  failureReason: string | null = null;
  userAgent = 'unknown';

  async ngOnInit(): Promise<void> {
    const result = await this.webGpuCapabilityService.inspect();
    this.supported = result.supported;
    this.adapterName = result.adapterName;
    this.deviceReady = result.deviceReady;
    this.failureReason = result.failureReason;
    this.secureContext = this.browserCapabilityService.isSecureContext();
    this.userAgent = this.browserCapabilityService.getUserAgent();
  }
}
