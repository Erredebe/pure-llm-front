import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";

import { ModelFacade } from "../../../application/model/model.facade";
import { SettingsFacade } from "../../../application/settings/settings.facade";
import { ModelSelectorComponent } from "../components/model-selector.component";

@Component({
  selector: "app-model-manager-page",
  standalone: true,
  imports: [ModelSelectorComponent],
  template: `
    <section class="panel">
      <p class="eyebrow">Models</p>
      <p class="lead">
        Keep the catalog in a repository so the UI never depends on provider
        internals.
      </p>

      <app-model-selector
        [models]="modelFacade.state.models()"
        [selectedModelId]="modelFacade.state.selectedModelId()"
        (selected)="select($event)"
      ></app-model-selector>
    </section>
  `,
  styles: [
    `
      .panel {
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        background: var(--surface);
        box-shadow: var(--shadow);
      }

      .eyebrow {
        margin: 0 0 8px;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.72rem;
        font-weight: 700;
      }

      h2,
      .lead {
        margin: 0;
      }

      .lead {
        margin: 10px 0 24px;
        color: var(--text-muted);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelManagerPageComponent implements OnInit {
  readonly modelFacade = inject(ModelFacade);
  private readonly settingsFacade = inject(SettingsFacade);

  async ngOnInit(): Promise<void> {
    if (this.modelFacade.state.models().length === 0) {
      await this.modelFacade.bootstrap();
    }
  }

  async select(modelId: string): Promise<void> {
    this.modelFacade.selectModel(modelId);
    const settings = await this.settingsFacade.load();
    await this.settingsFacade.save({
      ...settings,
      selectedModelId: modelId,
    });
  }
}
