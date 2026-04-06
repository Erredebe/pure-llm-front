import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ChatShellComponent } from '../components/chat-shell.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [ChatShellComponent],
  template: `<app-chat-shell></app-chat-shell>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatPageComponent {}
