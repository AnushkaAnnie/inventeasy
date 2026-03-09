import { BaseEntity } from './base-entity.model';

// Supplier interface extending BaseEntity
export interface Supplier extends BaseEntity {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    category: string;
    status: 'active' | 'inactive';
    contactPerson?: string;
}
