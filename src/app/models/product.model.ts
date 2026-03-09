import { BaseEntity } from './base-entity.model';

// Product interface extending BaseEntity
export interface Product extends BaseEntity {
    name: string;
    sku: string;
    description?: string;
    costPrice: number;
    sellingPrice: number;
    stockLevel: number;
    minStockLevel: number;
    maxStockLevel?: number;
    supplierId: string;
    category: string;
    unit: string;
    barcode?: string;
    imageUrl?: string;
    status: 'active' | 'discontinued';
}
