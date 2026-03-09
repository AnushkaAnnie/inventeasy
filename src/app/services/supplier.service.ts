import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { Supplier } from '../models/supplier.model';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private apiUrl = 'http://localhost:3001/suppliers';

    // BehaviorSubject for reactive state management
    private suppliersSubject = new BehaviorSubject<Supplier[]>([]);
    public suppliers$: Observable<Supplier[]> = this.suppliersSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadSuppliers();
    }

    // Load all suppliers from API
    loadSuppliers(): void {
        this.http.get<Supplier[]>(this.apiUrl).pipe(
            catchError(error => {
                console.error('Error loading suppliers:', error);
                return of([]);
            })
        ).subscribe(suppliers => {
            this.suppliersSubject.next(suppliers);
        });
    }

    // GET all suppliers as Observable
    getSuppliers(): Observable<Supplier[]> {
        return this.http.get<Supplier[]>(this.apiUrl).pipe(
            tap(suppliers => this.suppliersSubject.next(suppliers)),
            catchError(error => {
                console.error('Error fetching suppliers:', error);
                return of([]);
            })
        );
    }

    // GET single supplier by ID
    getSupplierById(id: string): Observable<Supplier | undefined> {
        return this.http.get<Supplier>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error(`Error fetching supplier ${id}:`, error);
                return of(undefined);
            })
        );
    }

    // POST - Create new supplier
    addSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
        const newSupplier = {
            ...supplier,
            id: Date.now().toString(),
            createdAt: new Date(),
            status: supplier.status || 'active'
        };
        return this.http.post<Supplier>(this.apiUrl, newSupplier).pipe(
            tap(() => this.loadSuppliers()),
            catchError(error => {
                console.error('Error adding supplier:', error);
                throw error;
            })
        );
    }

    // PUT - Update existing supplier
    updateSupplier(id: string, updates: Partial<Supplier>): Observable<Supplier> {
        return this.http.patch<Supplier>(`${this.apiUrl}/${id}`, {
            ...updates,
            updatedAt: new Date()
        }).pipe(
            tap(() => this.loadSuppliers()),
            catchError(error => {
                console.error(`Error updating supplier ${id}:`, error);
                throw error;
            })
        );
    }

    // DELETE supplier
    deleteSupplier(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.loadSuppliers()),
            catchError(error => {
                console.error(`Error deleting supplier ${id}:`, error);
                throw error;
            })
        );
    }
}
