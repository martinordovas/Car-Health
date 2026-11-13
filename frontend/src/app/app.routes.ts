import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'app/dashboard',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPageComponent),
    data: { mode: 'login' },
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPageComponent),
    data: { mode: 'register' },
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-layout').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-page').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'fuel',
        loadComponent: () => import('./features/fuel/fuel-list-page').then((m) => m.FuelListPageComponent),
      },
      {
        path: 'fuel/new',
        loadComponent: () => import('./features/fuel/fuel-form-page').then((m) => m.FuelFormPageComponent),
      },
      {
        path: 'services',
        loadComponent: () => import('./features/maintenance/maintenance-page').then((m) => m.MaintenancePageComponent),
      },
      {
        path: 'services/new',
        loadComponent: () => import('./features/maintenance/service-form-page').then((m) => m.ServiceFormPageComponent),
      },
      {
        path: 'stats',
        loadComponent: () => import('./features/stats/stats-page').then((m) => m.StatsPageComponent),
      },
      {
        path: 'garage',
        loadComponent: () => import('./features/garage/garage-page').then((m) => m.GaragePageComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'app/dashboard',
  },
];
