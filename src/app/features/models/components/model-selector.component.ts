import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ModelDescriptor } from '../../../domain/contracts/llm-provider';

@Component({
  selector: 'app-model-selector',
  standalone: true,
  template: `
    <div class="selector">
      @for (model of models(); track model.id) {
        <button type="button" [class.active]="model.id === selectedModelId()" (click)="selected.emit(model.id)">
          <strong>{{ model.label }}</strong>
          <span>{{ model.family }} · {{ model.sizeGb }} GB</span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .selector {
        display: grid;
        gap: 12px;
      }

      button {
        display: grid;
        gap: 6px;
        justify-items: start;
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.78);
      }

      button.active {
        border-color: rgba(199, 93, 44, 0.5);
        background: rgba(243, 179, 122, 0.26);
      }

      span {
        color: var(--text-muted);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelSelectorComponent {
  readonly models = input.required<ModelDescriptor[]>();
  readonly selectedModelId = input<string | null>(null);
  readonly selected = output<string>();
}
