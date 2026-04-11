import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { BrowserCapabilityService } from '../../../core/platform/browser-capability.service';
import { WebGpuCapabilityService } from '../../../core/platform/webgpu-capability.service';

@Component({
  selector: 'app-diagnostics-page',
  standalone: true,
  templateUrl: './diagnostics-page.component.html',
  styleUrl: './diagnostics-page.component.css',
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
