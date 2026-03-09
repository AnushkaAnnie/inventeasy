import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

// Custom directive to highlight products below reorder level
@Directive({
    selector: '[appLowStockHighlight]',
    standalone: true
})
export class LowStockHighlightDirective implements OnChanges {
    @Input() appLowStockHighlight: number = 0; // current stock level
    @Input() minStockLevel: number = 0;        // minimum threshold

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngOnChanges(changes: SimpleChanges): void {
        this.updateHighlight();
    }

    private updateHighlight(): void {
        const element = this.el.nativeElement;

        // Remove all previous highlight classes
        this.renderer.removeStyle(element, 'background-color');
        this.renderer.removeStyle(element, 'border-left');

        if (this.appLowStockHighlight <= 0) {
            // Out of stock - red highlight
            this.renderer.setStyle(element, 'background-color', '#fef2f2');
            this.renderer.setStyle(element, 'border-left', '4px solid #ef4444');
        } else if (this.appLowStockHighlight <= this.minStockLevel) {
            // Low stock (at or below min) - orange highlight
            this.renderer.setStyle(element, 'background-color', '#fff7ed');
            this.renderer.setStyle(element, 'border-left', '4px solid #f97316');
        }
    }
}
