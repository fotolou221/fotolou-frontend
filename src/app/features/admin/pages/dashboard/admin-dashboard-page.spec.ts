import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardPage } from './admin-dashboard-page';

describe('AdminDashboardPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the admin dashboard page', () => {
    const fixture = TestBed.createComponent(AdminDashboardPage);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
