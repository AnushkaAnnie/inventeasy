import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';
import { Product } from '../../models/product.model';
import { LowStockPipe } from '../../pipes/low-stock.pipe';
import { LowStockHighlightDirective } from '../../directives/low-stock-highlight.directive';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [
        CommonModule, RouterLink, ReactiveFormsModule,
        MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule,
        MatIconModule, MatButtonModule, MatCardModule, MatDialogModule, MatChipsModule,
        MatSelectModule, MatTooltipModule,
        LowStockPipe, LowStockHighlightDirective, CurrencyFormatPipe
    ],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['image', 'name', 'sku', 'category', 'costPrice', 'sellingPrice', 'stockLevel', 'status', 'actions'];
    dataSource = new MatTableDataSource<Product>([]);
    showLowStockOnly = false;
    allProducts: Product[] = [];
    showAddForm = false;
    suppliers: any[] = [];
    categories: string[] = [];
    selectedCategory = '';
    loading = true;

    productForm: FormGroup;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private productService: ProductService,
        private supplierService: SupplierService,
        private fb: FormBuilder
    ) {
        this.productForm = this.fb.group({
            name: ['', Validators.required],
            sku: ['', Validators.required],
            description: [''],
            costPrice: [0, [Validators.required, Validators.min(0)]],
            sellingPrice: [0, [Validators.required, Validators.min(0)]],
            stockLevel: [0, [Validators.required, Validators.min(0)]],
            minStockLevel: [0, [Validators.required, Validators.min(0)]],
            maxStockLevel: [100, Validators.min(0)],
            supplierId: ['', Validators.required],
            category: ['', Validators.required],
            unit: ['pcs', Validators.required],
            barcode: ['']
        });
    }

    ngOnInit(): void {
        this.productService.getProducts().subscribe(products => {
            this.allProducts = products;
            this.dataSource.data = products;
            this.categories = [...new Set(products.map(p => p.category))];
            this.loading = false;
        });
        this.supplierService.getSuppliers().subscribe(suppliers => {
            this.suppliers = suppliers;
        });
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
        if (this.sort) {
            this.dataSource.sort = this.sort;
        }
    }

    applyFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    filterByCategory(category: string): void {
        this.selectedCategory = this.selectedCategory === category ? '' : category;
        this.applyFilters();
    }

    toggleLowStockFilter(): void {
        this.showLowStockOnly = !this.showLowStockOnly;
        this.applyFilters();
    }

    private applyFilters(): void {
        let filtered = this.allProducts;
        if (this.showLowStockOnly) {
            filtered = filtered.filter(p => p.stockLevel <= p.minStockLevel);
        }
        if (this.selectedCategory) {
            filtered = filtered.filter(p => p.category === this.selectedCategory);
        }
        this.dataSource.data = filtered;
    }

    toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
        if (!this.showAddForm) {
            this.productForm.reset({ unit: 'pcs', maxStockLevel: 100 });
        }
    }

    addProduct(): void {
        if (this.productForm.valid) {
            this.productService.addProduct(this.productForm.value).subscribe({
                next: () => {
                    this.productService.getProducts().subscribe(products => {
                        this.allProducts = products;
                        this.dataSource.data = products;
                        this.categories = [...new Set(products.map(p => p.category))];
                    });
                    this.toggleAddForm();
                },
                error: (err) => console.error('Error adding product:', err)
            });
        }
    }

    deleteProduct(product: Product): void {
        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
            this.productService.deleteProduct(product.id).subscribe({
                next: () => {
                    this.productService.getProducts().subscribe(products => {
                        this.allProducts = products;
                        this.dataSource.data = products;
                    });
                },
                error: (err) => console.error('Error deleting product:', err)
            });
        }
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
}
