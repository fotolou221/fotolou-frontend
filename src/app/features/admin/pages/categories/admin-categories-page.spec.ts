import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminCategoriesPage } from './admin-categories-page';

describe('AdminCategoriesPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoriesPage],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the admin categories page', () => {
    const fixture = TestBed.createComponent(AdminCategoriesPage);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
