import { Injectable, inject } from '@angular/core';

import { BrowserCapabilityService } from './browser-capability.service';

@Injectable({ providedIn: 'root' })
export class WebGpuCapabilityService {
  private readonly browserCapability = inject(BrowserCapabilityService);

  async inspect(): Promise<{ supported: boolean; adapterName: string | null }> {
    if (!this.browserCapability.isWebGpuAvailable()) {
      return { supported: false, adapterName: null };
    }

    const gpu = (navigator as Navigator & {
      gpu?: {
        requestAdapter: () => Promise<{ info?: { description?: string } } | null>;
      };
    }).gpu;

    if (!gpu) {
      return { supported: false, adapterName: null };
    }

    const adapter = await gpu.requestAdapter();

    return {
      supported: adapter !== null,
      adapterName: adapter?.info?.description ?? null
    };
  }
}
