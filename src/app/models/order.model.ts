import { BaseEntity } from './base-entity.model';

// Order interface extending BaseEntity
export interface Order extends BaseEntity {
    type: 'IN' | 'OUT';
    productId: string;
    quantity: number;
    totalValue: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    orderNumber: string;
    notes?: string;
    processedBy: string;
}
