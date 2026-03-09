import { Pipe, PipeTransform } from '@angular/core';

// Custom currency formatting pipe
@Pipe({
    name: 'currencyFormat',
    standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
    transform(value: number, currencySymbol: string = '$', decimals: number = 2): string {
        if (value == null || isNaN(value)) return `${currencySymbol}0.00`;
        const formatted = value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return `${currencySymbol}${formatted}`;
    }
}
