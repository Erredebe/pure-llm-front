import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'chat'
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/pages/chat-page.component').then((m) => m.ChatPageComponent)
  },
  {
    path: 'models',
    loadComponent: () => import('./features/models/pages/model-manager-page.component').then((m) => m.ModelManagerPageComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/pages/settings-page.component').then((m) => m.SettingsPageComponent)
  },
  {
    path: 'diagnostics',
    loadComponent: () => import('./features/diagnostics/pages/diagnostics-page.component').then((m) => m.DiagnosticsPageComponent)
  },
  {
    path: '**',
    redirectTo: 'chat'
  }
];
