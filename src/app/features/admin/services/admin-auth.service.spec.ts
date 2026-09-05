import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'admin/login', component: class {} }])]
    });
    service = TestBed.inject(AdminAuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate with correct credentials', () => {
    const res = service.login('admin@fotolou.sn', 'fotolou2026');
    expect(res.success).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentAdmin()?.email).toBe('admin@fotolou.sn');
  });

  it('should fail with incorrect credentials', () => {
    const res = service.login('wrong@fotolou.sn', 'badpass');
    expect(res.success).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should logout and clear session', () => {
    service.login('admin@fotolou.sn', 'fotolou2026');
    expect(service.isAuthenticated()).toBe(true);
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentAdmin()).toBeNull();
  });
});
