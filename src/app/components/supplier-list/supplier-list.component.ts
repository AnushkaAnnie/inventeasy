import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier.model';

@Component({
    selector: 'app-supplier-list',
    standalone: true,
    // FormsModule imported for template-driven form (ngModel)
    imports: [
        CommonModule, FormsModule,
        MatCardModule, MatFormFieldModule, MatInputModule,
        MatButtonModule, MatIconModule, MatTableModule, MatPaginatorModule
    ],
    templateUrl: './supplier-list.component.html',
    styleUrl: './supplier-list.component.css'
})
export class SupplierListComponent implements OnInit {
    suppliers: Supplier[] = [];
    showAddForm = false;
    displayedColumns = ['name', 'email', 'phone', 'category', 'status', 'contactPerson', 'actions'];

    // Template-driven form model (using ngModel)
    supplierModel = {
        name: '',
        email: '',
        phone: '',
        address: '',
        category: '',
        contactPerson: ''
    };

    constructor(private supplierService: SupplierService) { }

    ngOnInit(): void {
        this.loadSuppliers();
    }

    loadSuppliers(): void {
        this.supplierService.getSuppliers().subscribe(suppliers => {
            this.suppliers = suppliers;
        });
    }

    toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
        if (!this.showAddForm) {
            this.resetForm();
        }
    }

    // Add supplier using template-driven form data
    addSupplier(): void {
        if (this.supplierModel.name && this.supplierModel.email && this.supplierModel.category) {
            this.supplierService.addSupplier({
                name: this.supplierModel.name,
                email: this.supplierModel.email,
                phone: this.supplierModel.phone,
                address: this.supplierModel.address,
                category: this.supplierModel.category,
                contactPerson: this.supplierModel.contactPerson,
                status: 'active'
            } as Partial<Supplier>).subscribe({
                next: () => {
                    this.loadSuppliers();
                    this.toggleAddForm();
                },
                error: (err) => console.error('Error adding supplier:', err)
            });
        }
    }

    deleteSupplier(supplier: Supplier): void {
        if (confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
            this.supplierService.deleteSupplier(supplier.id).subscribe({
                next: () => this.loadSuppliers(),
                error: (err) => console.error('Error deleting supplier:', err)
            });
        }
    }

    resetForm(): void {
        this.supplierModel = {
            name: '',
            email: '',
            phone: '',
            address: '',
            category: '',
            contactPerson: ''
        };
    }
}
