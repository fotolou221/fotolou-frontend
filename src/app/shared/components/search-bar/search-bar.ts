import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  template: `
    <div class="search-bar">
      <span class="search-bar__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>

      <input
        type="text"
        class="search-bar__input"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInputChange($event)"
      />

      @if (value) {
        <button class="search-bar__clear" (click)="clear()" type="button" aria-label="Effacer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      }
    </div>
  `,
  styleUrl: './search-bar.scss'
})
export class SearchBar {
  @Input() value = '';
  @Input() placeholder = 'Rechercher un salon';

  @Output() valueChange = new EventEmitter<string>();

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.valueChange.emit(input.value);
  }

  protected clear(): void {
    this.valueChange.emit('');
  }
}
