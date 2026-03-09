import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';
import { Product } from '../../models/product.model';
import { Supplier } from '../../models/supplier.model';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule],
    templateUrl: './product-detail.component.html',
    styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
    product: Product | null = null;
    supplier: Supplier | null = null;
    loading = true;

    constructor(
        private route: ActivatedRoute,
        private productService: ProductService,
        private supplierService: SupplierService
    ) { }

    ngOnInit(): void {
        // Get product ID from route parameters (child route)
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.productService.getProductById(id).subscribe(product => {
                if (product) {
                    this.product = product;
                    // Load associated supplier
                    this.supplierService.getSupplierById(product.supplierId).subscribe(supplier => {
                        this.supplier = supplier || null;
                        this.loading = false;
                    });
                } else {
                    this.loading = false;
                }
            });
        } else {
            this.loading = false;
        }
    }

    getStockStatus(): string {
        if (!this.product) return '';
        if (this.product.stockLevel === 0) return 'Out of Stock';
        if (this.product.stockLevel <= this.product.minStockLevel) return 'Low Stock';
        return 'In Stock';
    }

    getStockClass(): string {
        if (!this.product) return '';
        if (this.product.stockLevel === 0) return 'stock-out';
        if (this.product.stockLevel <= this.product.minStockLevel) return 'stock-low';
        return 'stock-ok';
    }
}
