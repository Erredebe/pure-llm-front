import { Injectable, inject } from '@angular/core';

import { BrowserCapabilityService } from './browser-capability.service';
import { WebGpuRuntimeService } from './webgpu-runtime.service';

@Injectable({ providedIn: 'root' })
export class WebGpuCapabilityService {
  private readonly browserCapability = inject(BrowserCapabilityService);
  private readonly webGpuRuntime = inject(WebGpuRuntimeService);

  async inspect(): Promise<{
    supported: boolean;
    secureContext: boolean;
    userAgent: string;
    adapterName: string | null;
    deviceReady: boolean;
    failureReason: string | null;
    runtimeReady: boolean;
    loadedModelId: string | null;
  }> {
    const secureContext = this.browserCapability.isSecureContext();
    const userAgent = this.browserCapability.getUserAgent();
    const runtimeReady = this.webGpuRuntime.runtimeReady();
    const loadedModelId = this.webGpuRuntime.lastLoadedModelId();

    if (!this.browserCapability.isWebGpuAvailable()) {
      return {
        supported: runtimeReady,
        secureContext,
        userAgent,
        adapterName: null,
        deviceReady: runtimeReady,
        failureReason: runtimeReady ? null : 'Navigator WebGPU API is not available in this browser.',
        runtimeReady,
        loadedModelId
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
        secureContext,
        userAgent,
        adapterName: null,
        deviceReady: false,
        failureReason: 'Navigator WebGPU API is present, but the GPU adapter is unavailable.',
        runtimeReady,
        loadedModelId
      };
    }

    try {
      const adapter = await gpu.requestAdapter();

      if (!adapter) {
        return {
          supported: false,
          secureContext,
          userAgent,
          adapterName: null,
          deviceReady: false,
          failureReason: 'WebGPU adapter request returned null on this device.',
          runtimeReady,
          loadedModelId
        };
      }

      if (!adapter.requestDevice) {
        return {
          supported: true,
          secureContext,
          userAgent,
          adapterName: adapter.info?.description ?? null,
          deviceReady: false,
          failureReason: 'WebGPU adapter is available, but device creation is not supported by this browser build.',
          runtimeReady,
          loadedModelId
        };
      }

      try {
        const device = await adapter.requestDevice();
        device.destroy?.();

        return {
          supported: true,
          secureContext,
          userAgent,
          adapterName: adapter.info?.description ?? null,
          deviceReady: true,
          failureReason: null,
          runtimeReady,
          loadedModelId
        };
      } catch (error) {
        return {
          supported: true,
          secureContext,
          userAgent,
          adapterName: adapter.info?.description ?? null,
          deviceReady: false,
          failureReason: this.toFailureReason(error),
          runtimeReady,
          loadedModelId
        };
      }
    } catch (error) {
      return {
        supported: false,
        secureContext,
        userAgent,
        adapterName: null,
        deviceReady: false,
        failureReason: this.toFailureReason(error),
        runtimeReady,
        loadedModelId
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
