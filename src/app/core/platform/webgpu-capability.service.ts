import { Injectable, inject } from '@angular/core';

import { BrowserCapabilityService } from './browser-capability.service';

@Injectable({ providedIn: 'root' })
export class WebGpuCapabilityService {
  private readonly browserCapability = inject(BrowserCapabilityService);

  async inspect(): Promise<{
    supported: boolean;
    adapterName: string | null;
    deviceReady: boolean;
    failureReason: string | null;
  }> {
    if (!this.browserCapability.isWebGpuAvailable()) {
      return {
        supported: false,
        adapterName: null,
        deviceReady: false,
        failureReason: 'Navigator WebGPU API is not available in this browser.'
      };
    }

    const gpu = (navigator as Navigator & {
      gpu?: {
        requestAdapter: () => Promise<{
          info?: { description?: string };
          requestDevice?: () => Promise<{ destroy?: () => void }>;
        } | null>;
      };
    }).gpu;

    if (!gpu) {
      return {
        supported: false,
        adapterName: null,
        deviceReady: false,
        failureReason: 'Navigator WebGPU API is present, but the GPU adapter is unavailable.'
      };
    }

    try {
      const adapter = await gpu.requestAdapter();

      if (!adapter) {
        return {
          supported: false,
          adapterName: null,
          deviceReady: false,
          failureReason: 'WebGPU adapter request returned null on this device.'
        };
      }

      if (!adapter.requestDevice) {
        return {
          supported: true,
          adapterName: adapter.info?.description ?? null,
          deviceReady: false,
          failureReason: 'WebGPU adapter is available, but device creation is not supported by this browser build.'
        };
      }

      try {
        const device = await adapter.requestDevice();
        device.destroy?.();

        return {
          supported: true,
          adapterName: adapter.info?.description ?? null,
          deviceReady: true,
          failureReason: null
        };
      } catch (error) {
        return {
          supported: true,
          adapterName: adapter.info?.description ?? null,
          deviceReady: false,
          failureReason: this.toFailureReason(error)
        };
      }
    } catch (error) {
      return {
        supported: false,
        adapterName: null,
        deviceReady: false,
        failureReason: this.toFailureReason(error)
      };
    }
  }

  private toFailureReason(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'Unknown WebGPU initialization failure.';
    }

    if (this.isPipelineDriverError(error.message)) {
      return 'WebGPU is exposed, but the Android GPU driver fails while creating compute pipelines for local inference.';
    }

    return error.message;
  }

  private isPipelineDriverError(message: string): boolean {
    return /CreateComputePipelines|VK_ERROR_UNKNOWN|vulkan|dawn/i.test(message);
  }
}
