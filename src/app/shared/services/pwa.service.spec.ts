import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { PwaService } from './pwa.service';

describe('PwaService', () => {
  let service: PwaService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        PwaService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(PwaService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect platform and mobile states', () => {
    expect(service.platform()).toBeDefined();
    expect(typeof service.isMobile()).toBe('boolean');
    expect(typeof service.isStandalone()).toBe('boolean');
  });

  it('should dismiss popup banner', () => {
    service.dismissBanner();
    expect(service.showBanner()).toBe(false);
  });

  it('should handle appinstalled event by setting standalone mode to true and closing prompts', () => {
    service.showBanner.set(true);

    window.dispatchEvent(new Event('appinstalled'));

    expect(service.isStandalone()).toBe(true);
    expect(service.showBanner()).toBe(false);
  });
});
