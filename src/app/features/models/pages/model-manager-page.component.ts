import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { AppSessionFacade } from '../../../application/session/app-session.facade';
import { ModelFacade } from '../../../application/model/model.facade';
import { ModelSelectorComponent } from '../components/model-selector.component';

@Component({
  selector: 'app-model-manager-page',
  standalone: true,
  imports: [ModelSelectorComponent],
  templateUrl: './model-manager-page.component.html',
  styleUrl: './model-manager-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelManagerPageComponent implements OnInit {
  private readonly appSessionFacade = inject(AppSessionFacade);
  readonly modelFacade = inject(ModelFacade);

  async ngOnInit(): Promise<void> {
    await this.appSessionFacade.bootstrap();
  }

  async select(modelId: string): Promise<void> {
    await this.appSessionFacade.selectModel(modelId);
  }
}
