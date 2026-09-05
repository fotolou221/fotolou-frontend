import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLoginPage } from './admin-login-page';

describe('AdminLoginPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLoginPage],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the admin login page', () => {
    const fixture = TestBed.createComponent(AdminLoginPage);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
