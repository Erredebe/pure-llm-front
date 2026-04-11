import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ModelDescriptor } from '../../../domain/contracts/llm-provider';

@Component({
  selector: 'app-model-selector',
  standalone: true,
  templateUrl: './model-selector.component.html',
  styleUrl: './model-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelSelectorComponent {
  readonly models = input.required<ModelDescriptor[]>();
  readonly selectedModelId = input<string | null>(null);
  readonly selected = output<string>();
}
