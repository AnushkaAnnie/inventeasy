import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Simulated authentication state
let isAuthenticated = true; // Set to true for demo purposes

// Functional route guard for authenticated access
export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    if (isAuthenticated) {
        return true;
    } else {
        console.warn('[AuthGuard] Access denied. Redirecting to dashboard.');
        router.navigate(['/dashboard']);
        return false;
    }
};

// Helper to toggle auth state (for testing)
export function setAuthenticated(value: boolean): void {
    isAuthenticated = value;
}
