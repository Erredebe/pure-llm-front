import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prompt-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="prompt" (ngSubmit)="submit()">
      <textarea
        name="prompt"
        [(ngModel)]="draft"
        [disabled]="disabled()"
        rows="5"
        placeholder="Ask the local model anything..."></textarea>

      <button type="submit" [disabled]="disabled() || !draft.trim()">Send</button>
    </form>
  `,
  styles: [
    `
      .prompt {
        display: grid;
        gap: 12px;
      }

      textarea {
        width: 100%;
        resize: vertical;
        min-height: 120px;
        padding: 16px;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.9);
      }

      button {
        justify-self: end;
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
export class PromptInputComponent {
  readonly disabled = input(false);
  readonly submitted = output<string>();

  draft = '';

  submit(): void {
    const value = this.draft.trim();

    if (!value) {
      return;
    }

    this.submitted.emit(value);
    this.draft = '';
  }
}
