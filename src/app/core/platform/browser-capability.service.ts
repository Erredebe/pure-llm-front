import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowserCapabilityService {
  isWebGpuAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in (navigator as Navigator & { gpu?: unknown });
  }

  prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
