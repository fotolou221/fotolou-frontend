import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-section-heading',
  imports: [RouterLink],
  template: `
    <div class="section-heading">
      <h2>{{ title }}</h2>
      @if (linkLabel && linkRoute) {
        <a [routerLink]="linkRoute">{{ linkLabel }}</a>
      }
    </div>
  `,
  styleUrl: './section-heading.scss'
})
export class SectionHeading {
  @Input({ required: true }) title = '';
  @Input() linkLabel = '';
  @Input() linkRoute = '';
}
