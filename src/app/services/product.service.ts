import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = 'http://localhost:3001/products';

    // BehaviorSubject for reactive state management
    private productsSubject = new BehaviorSubject<Product[]>([]);
    public products$: Observable<Product[]> = this.productsSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadProducts();
    }

    // Load all products from API
    loadProducts(): void {
        this.http.get<Product[]>(this.apiUrl).pipe(
            catchError(error => {
                console.error('Error loading products:', error);
                return of([]);
            })
        ).subscribe(products => {
            this.productsSubject.next(products);
        });
    }

    // GET all products as Observable
    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.apiUrl).pipe(
            tap(products => this.productsSubject.next(products)),
            catchError(error => {
                console.error('Error fetching products:', error);
                return of([]);
            })
        );
    }

    // GET single product by ID
    getProductById(id: string): Observable<Product | undefined> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error(`Error fetching product ${id}:`, error);
                return of(undefined);
            })
        );
    }

    // POST - Create new product
    addProduct(product: Partial<Product>): Observable<Product> {
        const newProduct = {
            ...product,
            id: Date.now().toString(),
            createdAt: new Date(),
            status: product.status || 'active'
        };
        return this.http.post<Product>(this.apiUrl, newProduct).pipe(
            tap(() => this.loadProducts()),
            catchError(error => {
                console.error('Error adding product:', error);
                throw error;
            })
        );
    }

    // PUT - Update existing product
    updateProduct(id: string, updates: Partial<Product>): Observable<Product> {
        return this.http.patch<Product>(`${this.apiUrl}/${id}`, {
            ...updates,
            updatedAt: new Date()
        }).pipe(
            tap(() => this.loadProducts()),
            catchError(error => {
                console.error(`Error updating product ${id}:`, error);
                throw error;
            })
        );
    }

    // DELETE product
    deleteProduct(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.loadProducts()),
            catchError(error => {
                console.error(`Error deleting product ${id}:`, error);
                throw error;
            })
        );
    }

    // Get low stock products (stockLevel <= minStockLevel)
    getLowStockProducts(): Observable<Product[]> {
        return this.products$.pipe(
            map(products => products.filter(p => p.stockLevel <= p.minStockLevel))
        );
    }

    // Get total inventory value
    getTotalInventoryValue(): Observable<number> {
        return this.products$.pipe(
            map(products => products.reduce((sum, p) => sum + (p.sellingPrice * p.stockLevel), 0))
        );
    }

    // Get total product count
    getTotalProductCount(): Observable<number> {
        return this.products$.pipe(
            map(products => products.length)
        );
    }
}
