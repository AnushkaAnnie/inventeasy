import { Pipe, PipeTransform } from '@angular/core';
import { Product } from '../models/product.model';

// Custom pipe to filter low-stock items
@Pipe({
    name: 'lowStock',
    standalone: true,
    pure: false
})
export class LowStockPipe implements PipeTransform {
    transform(products: Product[], showLowStockOnly: boolean = true): Product[] {
        if (!products) return [];
        if (!showLowStockOnly) return products;
        return products.filter(product => product.stockLevel <= product.minStockLevel);
    }
}
