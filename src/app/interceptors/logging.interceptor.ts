import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

// Functional HTTP interceptor for logging requests and responses
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
    const startTime = Date.now();
    console.log(`[HTTP] ${req.method} ${req.url}`);

    return next(req).pipe(
        tap({
            next: (event) => {
                const elapsed = Date.now() - startTime;
                console.log(`[HTTP] ${req.method} ${req.url} completed in ${elapsed}ms`);
            },
            error: (error) => {
                const elapsed = Date.now() - startTime;
                console.error(`[HTTP] ${req.method} ${req.url} failed after ${elapsed}ms`, error);
            }
        })
    );
};
