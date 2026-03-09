import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { Order } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

// Custom validator: ensures order quantity doesn't exceed stock for OUT orders
function stockLimitValidator(products: Product[]): (control: AbstractControl) => ValidationErrors | null {
    return (formGroup: AbstractControl): ValidationErrors | null => {
        const type = formGroup.get('type')?.value;
        const productId = formGroup.get('productId')?.value;
        const quantity = formGroup.get('quantity')?.value;

        if (type === 'OUT' && productId && quantity) {
            const product = products.find(p => p.id === productId);
            if (product && quantity > product.stockLevel) {
                return { stockExceeded: { available: product.stockLevel, requested: quantity } };
            }
        }
        return null;
    };
}

@Component({
    selector: 'app-order-tracker',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
        MatIconModule, MatSelectModule, MatTableModule, MatPaginatorModule,
        MatTooltipModule, CurrencyFormatPipe
    ],
    templateUrl: './order-tracker.component.html',
    styleUrl: './order-tracker.component.css'
})
export class OrderTrackerComponent implements OnInit {
    orders: Order[] = [];
    products: Product[] = [];
    orderForm!: FormGroup;
    errorMessage = '';
    successMessage = '';
    displayedColumns = ['orderNumber', 'type', 'productId', 'quantity', 'totalValue', 'status', 'createdAt', 'actions'];

    constructor(
        private orderService: OrderService,
        private productService: ProductService,
        private fb: FormBuilder
    ) { }

    ngOnInit(): void {
        this.orderForm = this.fb.group({
            type: ['IN', Validators.required],
            productId: ['', Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]],
            notes: ['']
        });

        this.loadData();
    }

    loadData(): void {
        this.productService.getProducts().subscribe(products => {
            this.products = products;
            // Apply custom stock limit validator after products load
            this.orderForm.setValidators(stockLimitValidator(this.products));
            this.orderForm.updateValueAndValidity();
        });
        this.orderService.getOrders().subscribe(orders => {
            this.orders = orders;
        });
    }

    // Get product name by ID
    getProductName(productId: string): string {
        const product = this.products.find(p => p.id === productId);
        return product ? product.name : 'Unknown Product';
    }

    // Calculate order value
    calculateValue(): number {
        const productId = this.orderForm.get('productId')?.value;
        const quantity = this.orderForm.get('quantity')?.value;
        const product = this.products.find(p => p.id === productId);
        if (product && quantity) {
            return product.sellingPrice * quantity;
        }
        return 0;
    }

    // Place a new order
    addOrder(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (this.orderForm.invalid) {
            if (this.orderForm.errors?.['stockExceeded']) {
                const err = this.orderForm.errors['stockExceeded'];
                this.errorMessage = `Insufficient stock! Available: ${err.available}, Requested: ${err.requested}`;
            }
            return;
        }

        const formValue = this.orderForm.value;
        const totalValue = this.calculateValue();

        this.orderService.addOrder({
            type: formValue.type,
            productId: formValue.productId,
            quantity: formValue.quantity,
            totalValue: totalValue,
            notes: formValue.notes,
            status: 'pending'
        }).subscribe({
            next: () => {
                this.loadData();
                this.orderForm.reset({ type: 'IN', quantity: 1 });
                this.successMessage = 'Order created successfully!';
                this.errorMessage = '';
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                this.errorMessage = 'Failed to create order. Please try again.';
                console.error('Error creating order:', err);
            }
        });
    }

    // Move order: pending → processing
    processOrder(order: Order): void {
        this.errorMessage = '';
        this.orderService.processOrder(order.id).subscribe({
            next: () => {
                this.successMessage = `Order ${order.orderNumber} is now processing.`;
                this.loadData();
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: () => this.errorMessage = 'Failed to process order.'
        });
    }

    // Complete order: update stock + mark completed
    completeOrder(order: Order): void {
        this.errorMessage = '';

        // Check stock for OUT orders
        if (order.type === 'OUT') {
            const product = this.products.find(p => p.id === order.productId);
            if (product && product.stockLevel < order.quantity) {
                this.errorMessage = `Cannot complete: Insufficient stock for ${product.name}. Available: ${product.stockLevel}, Required: ${order.quantity}`;
                return;
            }
        }

        this.orderService.completeOrder(order).subscribe({
            next: () => {
                this.successMessage = `Order ${order.orderNumber} completed! Stock updated.`;
                this.loadData();
                this.productService.loadProducts(); // Refresh product data everywhere
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: () => this.errorMessage = 'Failed to complete order.'
        });
    }

    // Cancel order
    cancelOrder(order: Order): void {
        this.errorMessage = '';
        if (confirm(`Cancel order ${order.orderNumber}?`)) {
            this.orderService.cancelOrder(order.id).subscribe({
                next: () => {
                    this.successMessage = `Order ${order.orderNumber} cancelled.`;
                    this.loadData();
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: () => this.errorMessage = 'Failed to cancel order.'
            });
        }
    }
}
