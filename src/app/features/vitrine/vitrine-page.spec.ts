import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VitrinePage } from './vitrine-page';
import { PwaService } from '../../shared/services/pwa.service';

describe('VitrinePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VitrinePage],
      providers: [
        provideRouter([]),
        PwaService
      ]
    }).compileComponents();
  });

  it('should create the vitrine component', () => {
    const fixture = TestBed.createComponent(VitrinePage);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render the hero title and call to action', () => {
    const fixture = TestBed.createComponent(VitrinePage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.vitrine-hero__title')?.textContent).toContain('Moins d\'attente');
    expect(compiled.querySelector('.vitrine-hero__title-highlight')?.textContent).toContain('Plus de temps');
  });

  it('should toggle FAQ accordion items', () => {
    const fixture = TestBed.createComponent(VitrinePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['faqs']()[0].isOpen).toBe(true);
    component['toggleFaq'](0);
    expect(component['faqs']()[0].isOpen).toBe(false);
  });
});
