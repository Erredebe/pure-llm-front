import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { ModelFacade } from '../../../application/model/model.facade';
import { SettingsFacade } from '../../../application/settings/settings.facade';
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
  readonly modelFacade = inject(ModelFacade);
  private readonly settingsFacade = inject(SettingsFacade);

  async ngOnInit(): Promise<void> {
    const settings = await this.settingsFacade.load();
    await this.modelFacade.bootstrap(settings.selectedModelId);
  }

  async select(modelId: string): Promise<void> {
    this.modelFacade.selectModel(modelId);
    await this.settingsFacade.updateActiveProfile({ selectedModelId: modelId });
  }
}
