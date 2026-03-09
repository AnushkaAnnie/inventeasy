import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

// Functional HTTP interceptor for error handling
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unknown error occurred';

            if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = `Client Error: ${error.error.message}`;
            } else {
                // Server-side error
                switch (error.status) {
                    case 0:
                        errorMessage = 'Unable to connect to the server. Please check if JSON Server is running.';
                        break;
                    case 404:
                        errorMessage = `Resource not found: ${req.url}`;
                        break;
                    case 500:
                        errorMessage = 'Internal server error';
                        break;
                    default:
                        errorMessage = `Server Error: ${error.status} - ${error.message}`;
                }
            }

            console.error('[HTTP Error]', errorMessage);
            return throwError(() => new Error(errorMessage));
        })
    );
};
