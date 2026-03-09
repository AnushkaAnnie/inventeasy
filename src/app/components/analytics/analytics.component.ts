import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { SupplierService } from '../../services/supplier.service';
import { Product } from '../../models/product.model';
import { Order } from '../../models/order.model';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
    selector: 'app-analytics',
    standalone: true,
    imports: [CommonModule, RouterLink, MatIconModule, CurrencyFormatPipe],
    templateUrl: './analytics.component.html',
    styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
    products: Product[] = [];
    orders: Order[] = [];

    // Metrics
    totalRevenue = 0;
    totalInventoryValue = 0;
    avgProductPrice = 0;
    profitMargin = 0;

    // Charts
    categoryData: { name: string; count: number; value: number; color: string; percentage: number }[] = [];
    stockHealthData: { label: string; count: number; color: string; percentage: number }[] = [];
    topProducts: { name: string; revenue: number; orders: number }[] = [];
    monthlyRevenue: { month: string; value: number; percentage: number }[] = [];

    loading = true;

    constructor(
        private productService: ProductService,
        private orderService: OrderService,
        private supplierService: SupplierService
    ) { }

    ngOnInit(): void {
        this.productService.getProducts().subscribe();
        this.orderService.getOrders().subscribe();

        this.productService.products$.subscribe(products => {
            this.products = products;
            this.buildData();
        });

        this.orderService.orders$.subscribe(orders => {
            this.orders = orders;
            this.buildData();
        });
    }

    private buildData(): void {
        if (this.products.length === 0) return;
        this.loading = false;

        // Metrics
        this.totalRevenue = this.orders
            .filter(o => o.type === 'OUT' && o.status === 'completed')
            .reduce((sum, o) => sum + o.totalValue, 0);

        this.totalInventoryValue = this.products.reduce((sum, p) => sum + (p.sellingPrice * p.stockLevel), 0);

        this.avgProductPrice = this.products.length > 0
            ? this.products.reduce((sum, p) => sum + p.sellingPrice, 0) / this.products.length
            : 0;

        const totalCost = this.products.reduce((sum, p) => sum + p.costPrice, 0);
        const totalSelling = this.products.reduce((sum, p) => sum + p.sellingPrice, 0);
        this.profitMargin = totalSelling > 0 ? Math.round(((totalSelling - totalCost) / totalSelling) * 100) : 0;

        // Category distribution
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
        const categoryMap = new Map<string, { count: number; value: number }>();
        this.products.forEach(p => {
            const existing = categoryMap.get(p.category) || { count: 0, value: 0 };
            categoryMap.set(p.category, {
                count: existing.count + 1,
                value: existing.value + (p.sellingPrice * p.stockLevel)
            });
        });

        let i = 0;
        this.categoryData = [];
        categoryMap.forEach((data, name) => {
            this.categoryData.push({
                name,
                count: data.count,
                value: data.value,
                color: colors[i % colors.length],
                percentage: Math.round((data.count / this.products.length) * 100)
            });
            i++;
        });

        // Stock health
        const inStock = this.products.filter(p => p.stockLevel > p.minStockLevel).length;
        const lowStock = this.products.filter(p => p.stockLevel > 0 && p.stockLevel <= p.minStockLevel).length;
        const outOfStock = this.products.filter(p => p.stockLevel === 0).length;
        const total = this.products.length;

        this.stockHealthData = [
            { label: 'Healthy', count: inStock, color: '#10b981', percentage: Math.round((inStock / total) * 100) },
            { label: 'Low Stock', count: lowStock, color: '#f59e0b', percentage: Math.round((lowStock / total) * 100) },
            { label: 'Out of Stock', count: outOfStock, color: '#ef4444', percentage: Math.round((outOfStock / total) * 100) }
        ];

        // Top products by potential revenue
        this.topProducts = this.products
            .sort((a, b) => (b.sellingPrice * b.stockLevel) - (a.sellingPrice * a.stockLevel))
            .slice(0, 5)
            .map(p => ({
                name: p.name,
                revenue: p.sellingPrice * p.stockLevel,
                orders: this.orders.filter(o => o.productId === p.id).length
            }));

        // Monthly revenue (simulated from orders)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const maxVal = Math.max(this.totalRevenue * 0.4, 1);
        this.monthlyRevenue = months.map((month, idx) => {
            const val = Math.round(this.totalRevenue * (0.1 + Math.random() * 0.3));
            return { month, value: val, percentage: Math.min(100, Math.round((val / maxVal) * 100)) };
        });
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
