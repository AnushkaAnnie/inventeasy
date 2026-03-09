import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map, switchMap } from 'rxjs';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private apiUrl = 'http://localhost:3001/orders';
    private productsUrl = 'http://localhost:3001/products';

    // BehaviorSubject for reactive state management
    private ordersSubject = new BehaviorSubject<Order[]>([]);
    public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadOrders();
    }

    // Load all orders from API
    loadOrders(): void {
        this.http.get<Order[]>(this.apiUrl).pipe(
            catchError(error => {
                console.error('Error loading orders:', error);
                return of([]);
            })
        ).subscribe(orders => {
            this.ordersSubject.next(orders);
        });
    }

    // GET all orders as Observable
    getOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(this.apiUrl).pipe(
            tap(orders => this.ordersSubject.next(orders)),
            catchError(error => {
                console.error('Error fetching orders:', error);
                return of([]);
            })
        );
    }

    // GET single order by ID
    getOrderById(id: string): Observable<Order | undefined> {
        return this.http.get<Order>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error(`Error fetching order ${id}:`, error);
                return of(undefined);
            })
        );
    }

    // POST - Create new order
    addOrder(order: Partial<Order>): Observable<Order> {
        const orderCount = this.ordersSubject.value.length;
        const newOrder = {
            ...order,
            id: Date.now().toString(),
            createdAt: new Date(),
            orderNumber: `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, '0')}`,
            status: order.status || 'pending',
            processedBy: order.processedBy || 'Admin'
        };
        return this.http.post<Order>(this.apiUrl, newOrder).pipe(
            tap(() => this.loadOrders()),
            catchError(error => {
                console.error('Error adding order:', error);
                throw error;
            })
        );
    }

    // PUT - Update existing order
    updateOrder(id: string, updates: Partial<Order>): Observable<Order> {
        return this.http.patch<Order>(`${this.apiUrl}/${id}`, {
            ...updates,
            updatedAt: new Date()
        }).pipe(
            tap(() => this.loadOrders()),
            catchError(error => {
                console.error(`Error updating order ${id}:`, error);
                throw error;
            })
        );
    }

    // DELETE order
    deleteOrder(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.loadOrders()),
            catchError(error => {
                console.error(`Error deleting order ${id}:`, error);
                throw error;
            })
        );
    }

    // Move order from pending → processing
    processOrder(id: string): Observable<Order> {
        return this.updateOrder(id, { status: 'processing' } as Partial<Order>);
    }

    // Complete order: update status and adjust stock
    completeOrder(order: Order): Observable<any> {
        // First get current product data
        return this.http.get<Product>(`${this.productsUrl}/${order.productId}`).pipe(
            switchMap(product => {
                let newStockLevel: number;

                if (order.type === 'OUT') {
                    // Deduct stock, prevent negative
                    newStockLevel = Math.max(0, product.stockLevel - order.quantity);
                } else {
                    // IN order: add stock
                    newStockLevel = product.stockLevel + order.quantity;
                }

                // Update product stock first
                return this.http.patch<Product>(`${this.productsUrl}/${order.productId}`, {
                    stockLevel: newStockLevel,
                    updatedAt: new Date()
                }).pipe(
                    // Then update order status
                    switchMap(() => this.updateOrder(order.id, { status: 'completed' } as Partial<Order>))
                );
            }),
            catchError(error => {
                console.error('Error completing order:', error);
                throw error;
            })
        );
    }

    // Cancel order
    cancelOrder(id: string): Observable<Order> {
        return this.updateOrder(id, { status: 'cancelled' } as Partial<Order>);
    }

    // Get total revenue from completed OUT orders
    getTotalRevenue(): Observable<number> {
        return this.orders$.pipe(
            map(orders => orders
                .filter(o => o.type === 'OUT' && o.status === 'completed')
                .reduce((sum, o) => sum + o.totalValue, 0)
            )
        );
    }
}
