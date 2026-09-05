import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-pagination',
  imports: [FormsModule],
  template: `
    <div class="admin-pagination">
      
      <!-- Info Left: Current Items Range -->
      <div class="admin-pagination__info">
        <span>
          Affichage <strong>{{ startItem() }}</strong> à <strong>{{ endItem() }}</strong> sur <strong>{{ totalItems }}</strong> éléments
        </span>

        <!-- Page Size Selector -->
        <div class="admin-pagination__page-size">
          <label for="page-size-select">Par page :</label>
          <select
            id="page-size-select"
            [ngModel]="pageSize"
            (ngModelChange)="onPageSizeChange($event)"
          >
            @for (size of pageSizeOptions; track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Navigation Right: Page Buttons -->
      @if (totalPages() > 1) {
        <div class="admin-pagination__nav">
          
          <!-- Previous Page Button -->
          <button
            type="button"
            class="admin-pagination__btn admin-pagination__btn--arrow"
            [disabled]="currentPage <= 1"
            (click)="goToPage(currentPage - 1)"
            title="Page précédente"
            aria-label="Page précédente"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <!-- Page Numbers -->
          <div class="admin-pagination__pages">
            @for (page of visiblePages(); track page) {
              @if (page === -1) {
                <span class="admin-pagination__ellipsis">&hellip;</span>
              } @else {
                <button
                  type="button"
                  class="admin-pagination__btn admin-pagination__btn--number"
                  [class.active]="page === currentPage"
                  (click)="goToPage(page)"
                >
                  {{ page }}
                </button>
              }
            }
          </div>

          <!-- Next Page Button -->
          <button
            type="button"
            class="admin-pagination__btn admin-pagination__btn--arrow"
            [disabled]="currentPage >= totalPages()"
            (click)="goToPage(currentPage + 1)"
            title="Page suivante"
            aria-label="Page suivante"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

        </div>
      }

    </div>
  `,
  styleUrl: './admin-pagination.scss'
})
export class AdminPagination {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Input() pageSizeOptions = [10, 20, 50, 100];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  protected readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalItems / (this.pageSize || 10)));
  });

  protected readonly startItem = computed(() => {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  });

  protected readonly endItem = computed(() => {
    return Math.min(this.totalItems, this.currentPage * this.pageSize);
  });

  protected readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    pages.push(1);

    if (current > 3) {
      pages.push(-1); // Ellipsis
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push(-1); // Ellipsis
    }

    pages.push(total);
    return pages;
  });

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  protected onPageSizeChange(newSize: number): void {
    const parsed = Number(newSize);
    this.pageSizeChange.emit(parsed);
    this.pageChange.emit(1); // Reset to page 1 on page size change
  }
}
