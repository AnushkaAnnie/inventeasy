import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';
import { OrderService } from '../../services/order.service';
import { Product } from '../../models/product.model';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { Observable, combineLatest, map, interval, Subscription, startWith, switchMap } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, MatIconModule, MatTooltipModule, CurrencyFormatPipe],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
    totalProducts = 0;
    totalRevenue = 0;
    lowStockCount = 0;
    totalSuppliers = 0;
    inventoryValue = 0;
    totalOrders = 0;

    lowStockProducts: Product[] = [];
    recentProducts: Product[] = [];
    allProducts: Product[] = [];

    // For animated counters
    displayProducts = 0;
    displayRevenue = 0;
    displayLowStock = 0;
    displaySuppliers = 0;
    displayInventory = 0;

    // Chart data
    categoryData: { name: string; count: number; color: string; percentage: number }[] = [];
    stockStatusData: { label: string; count: number; color: string }[] = [];

    loading = true;
    private subs: Subscription[] = [];

    constructor(
        private productService: ProductService,
        private supplierService: SupplierService,
        private orderService: OrderService
    ) { }

    ngOnInit(): void {
        // Load data
        this.productService.getProducts().subscribe();
        this.supplierService.getSuppliers().subscribe();
        this.orderService.getOrders().subscribe();

        // Subscribe to reactive data
        const sub1 = this.productService.products$.subscribe(products => {
            this.allProducts = products;
            this.totalProducts = products.length;
            this.inventoryValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.stockLevel), 0);
            this.lowStockProducts = products.filter(p => p.stockLevel <= p.minStockLevel);
            this.lowStockCount = this.lowStockProducts.length;
            this.recentProducts = products.slice(0, 5);
            this.buildChartData(products);
            this.animateCounters();
            this.loading = false;
        });

        const sub2 = this.supplierService.suppliers$.subscribe(suppliers => {
            this.totalSuppliers = suppliers.filter(s => s.status === 'active').length;
            this.animateCounters();
        });

        const sub3 = this.orderService.orders$.subscribe(orders => {
            this.totalOrders = orders.length;
            this.totalRevenue = orders
                .filter(o => o.type === 'OUT' && o.status === 'completed')
                .reduce((sum, o) => sum + o.totalValue, 0);
            this.animateCounters();
        });

        this.subs.push(sub1, sub2, sub3);
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    private animateCounters(): void {
        this.animateValue('displayProducts', this.totalProducts, 600);
        this.animateValue('displayRevenue', this.totalRevenue, 800);
        this.animateValue('displayLowStock', this.lowStockCount, 400);
        this.animateValue('displaySuppliers', this.totalSuppliers, 500);
        this.animateValue('displayInventory', this.inventoryValue, 800);
    }
    private timers: { [key: string]: any } = {};

    private animateValue(prop: string, target: number, duration: number): void {
        if (this.timers[prop]) {
            clearInterval(this.timers[prop]);
        }

        const start = (this as any)[prop] || 0;
        const diff = target - start;
        if (diff === 0) return; // Skip if already at target

        const steps = Math.max(20, Math.min(60, Math.abs(diff)));
        const stepDuration = duration / steps;
        let step = 0;

        this.timers[prop] = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            (this as any)[prop] = Math.round(start + diff * eased);
            if (step >= steps) {
                (this as any)[prop] = target;
                clearInterval(this.timers[prop]);
                delete this.timers[prop];
            }
        }, stepDuration);
    }

    private buildChartData(products: Product[]): void {
        // Category distribution
        const categoryMap = new Map<string, number>();
        products.forEach(p => {
            categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
        });
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
        let i = 0;
        this.categoryData = [];
        categoryMap.forEach((count, name) => {
            this.categoryData.push({
                name,
                count,
                color: colors[i % colors.length],
                percentage: products.length > 0 ? Math.round((count / products.length) * 100) : 0
            });
            i++;
        });

        // Stock status
        const inStock = products.filter(p => p.stockLevel > p.minStockLevel).length;
        const lowStock = products.filter(p => p.stockLevel > 0 && p.stockLevel <= p.minStockLevel).length;
        const outOfStock = products.filter(p => p.stockLevel === 0).length;
        this.stockStatusData = [
            { label: 'In Stock', count: inStock, color: '#10b981' },
            { label: 'Low Stock', count: lowStock, color: '#f59e0b' },
            { label: 'Out of Stock', count: outOfStock, color: '#ef4444' }
        ];
    }

    getStockPercentage(product: Product): number {
        const max = product.maxStockLevel || product.minStockLevel * 3;
        return Math.min(100, Math.round((product.stockLevel / max) * 100));
    }

    getStockColor(product: Product): string {
        if (product.stockLevel === 0) return '#ef4444';
        if (product.stockLevel <= product.minStockLevel) return '#f59e0b';
        return '#10b981';
    }

    getCategoryGradient(): string {
        if (this.categoryData.length === 0) return 'conic-gradient(#e2e8f0 0deg 360deg)';
        let gradient = 'conic-gradient(';
        let currentDeg = 0;
        this.categoryData.forEach((cat, i) => {
            const deg = (cat.percentage / 100) * 360;
            gradient += `${cat.color} ${currentDeg}deg ${currentDeg + deg}deg`;
            currentDeg += deg;
            if (i < this.categoryData.length - 1) gradient += ', ';
        });
        gradient += ')';
        return gradient;
    }
}
