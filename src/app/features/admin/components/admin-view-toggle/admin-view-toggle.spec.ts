import { TestBed } from '@angular/core/testing';
import { AdminViewToggle } from './admin-view-toggle';

describe('AdminViewToggle', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminViewToggle]
    }).compileComponents();
  });

  it('should create the admin view toggle component', () => {
    const fixture = TestBed.createComponent(AdminViewToggle);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should emit viewModeChange when mode changes', () => {
    const fixture = TestBed.createComponent(AdminViewToggle);
    const component = fixture.componentInstance;
    component.viewMode = 'table';
    fixture.detectChanges();

    let emitted = 'table';
    component.viewModeChange.subscribe(m => emitted = m);

    component['setView']('grid');
    expect(emitted).toBe('grid');
  });
});
