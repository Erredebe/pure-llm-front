import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Angular + WebGPU</p>
          <h1>Browser LLM Workbench</h1>
        </div>

        <nav>
          <a routerLink="/chat" routerLinkActive="active">Chat</a>
          <a routerLink="/models" routerLinkActive="active">Models</a>
          <a routerLink="/settings" routerLinkActive="active">Settings</a>
          <a routerLink="/diagnostics" routerLinkActive="active">Diagnostics</a>
        </nav>
      </header>

      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        min-height: 100vh;
        padding: 24px;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        max-width: 1200px;
        margin: 0 auto 20px;
        padding: 24px 28px;
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        background: var(--surface);
        backdrop-filter: blur(18px);
        box-shadow: var(--shadow);
      }

      .eyebrow {
        margin: 0 0 8px;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.72rem;
        font-weight: 700;
      }

      h1 {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(2rem, 2vw + 1rem, 3.2rem);
        font-weight: 600;
      }

      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      a {
        padding: 10px 16px;
        border-radius: 999px;
        color: var(--text-muted);
        text-decoration: none;
        background: rgba(255, 255, 255, 0.6);
        transition: transform 140ms ease, color 140ms ease, background 140ms ease;
      }

      a:hover,
      a.active {
        color: var(--text);
        background: var(--surface-strong);
        transform: translateY(-1px);
      }

      main {
        max-width: 1200px;
        margin: 0 auto;
      }

      @media (max-width: 900px) {
        .topbar {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}
