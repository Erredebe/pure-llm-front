import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prompt-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './prompt-input.component.html',
  styleUrl: './prompt-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromptInputComponent {
  @ViewChild('promptField') private readonly promptField?: ElementRef<HTMLTextAreaElement>;

  readonly disabled = input(false);
  readonly submitDisabled = input(false);
  readonly submitted = output<string>();

  draft = '';
  private shouldRestoreFocus = false;

  constructor() {
    effect(() => {
      if (!this.disabled() && this.shouldRestoreFocus) {
        queueMicrotask(() => this.promptField?.nativeElement.focus({ preventScroll: true }));
        this.shouldRestoreFocus = false;
      }
    });
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.submit();
  }

  submit(): void {
    const value = this.draft.trim();

    if (!value || this.disabled() || this.submitDisabled()) {
      return;
    }

    this.submitted.emit(value);
    this.draft = '';
    this.shouldRestoreFocus = true;
  }
}
