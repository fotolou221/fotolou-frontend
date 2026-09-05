import { TestBed } from '@angular/core/testing';
import { AdminPagination } from './admin-pagination';

describe('AdminPagination', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPagination]
    }).compileComponents();
  });

  it('should create the admin pagination component', () => {
    const fixture = TestBed.createComponent(AdminPagination);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should calculate total pages and range correctly', () => {
    const fixture = TestBed.createComponent(AdminPagination);
    const component = fixture.componentInstance;
    component.totalItems = 20;
    component.pageSize = 6;
    component.currentPage = 2;
    fixture.detectChanges();

    expect(component['totalPages']()).toBe(4);
    expect(component['startItem']()).toBe(7);
    expect(component['endItem']()).toBe(12);
  });

  it('should emit pageChange when navigating', () => {
    const fixture = TestBed.createComponent(AdminPagination);
    const component = fixture.componentInstance;
    component.totalItems = 20;
    component.pageSize = 6;
    component.currentPage = 1;
    fixture.detectChanges();

    let targetPage = 1;
    component.pageChange.subscribe(p => targetPage = p);

    component['goToPage'](2);
    expect(targetPage).toBe(2);
  });
});
