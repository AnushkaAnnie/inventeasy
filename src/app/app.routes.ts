import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

// Application routes with lazy-loaded components and child routes
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'products',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./components/product-list/product-list.component').then(m => m.ProductListComponent)
            },
            {
                // Child route for product details
                path: ':id',
                loadComponent: () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
            }
        ]
    },
    {
        path: 'suppliers',
        canActivate: [authGuard],
        loadComponent: () => import('./components/supplier-list/supplier-list.component').then(m => m.SupplierListComponent)
    },
    {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./components/order-tracker/order-tracker.component').then(m => m.OrderTrackerComponent)
    },
    {
        path: 'analytics',
        loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent)
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
