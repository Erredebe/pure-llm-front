import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SettingsFacade } from '../../../application/settings/settings.facade';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="panel">
      <p class="eyebrow">Settings</p>
      <h2>Inference defaults</h2>

      <form class="form" (ngSubmit)="save()">
        <label>
          <span>Temperature</span>
          <input type="number" step="0.1" min="0" max="2" [(ngModel)]="temperature" name="temperature">
        </label>

        <label>
          <span>Max tokens</span>
          <input type="number" min="32" max="2048" [(ngModel)]="maxTokens" name="maxTokens">
        </label>

        <button type="submit">Save settings</button>
      </form>
    </section>
  `,
  styles: [
    `
      .panel {
        max-width: 680px;
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

      h2 {
        margin: 0 0 24px;
      }

      .form {
        display: grid;
        gap: 18px;
      }

      label {
        display: grid;
        gap: 8px;
      }

      input {
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 12px;
      }

      button {
        width: fit-content;
        padding: 12px 18px;
        border: 0;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-weight: 700;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPageComponent implements OnInit {
  private readonly settingsFacade = inject(SettingsFacade);

  temperature = 0.7;
  maxTokens = 256;

  async ngOnInit(): Promise<void> {
    const settings = await this.settingsFacade.load();
    this.temperature = settings.temperature;
    this.maxTokens = settings.maxTokens;
  }

  async save(): Promise<void> {
    const settings = await this.settingsFacade.load();
    await this.settingsFacade.save({
      ...settings,
      temperature: this.temperature,
      maxTokens: this.maxTokens
    });
  }
}
