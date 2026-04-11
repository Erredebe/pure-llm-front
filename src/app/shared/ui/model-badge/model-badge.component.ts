import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-model-badge',
  standalone: true,
  templateUrl: './model-badge.component.html',
  styleUrl: './model-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelBadgeComponent {
  readonly label = input.required<string>();
}
