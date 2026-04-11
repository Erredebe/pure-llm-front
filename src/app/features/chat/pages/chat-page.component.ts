import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ChatShellComponent } from '../components/chat-shell.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [ChatShellComponent],
  templateUrl: './chat-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatPageComponent {}
