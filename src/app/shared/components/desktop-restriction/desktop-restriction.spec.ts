import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DesktopRestriction } from './desktop-restriction';

describe('DesktopRestriction', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesktopRestriction],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the desktop restriction component', () => {
    const fixture = TestBed.createComponent(DesktopRestriction);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should not block vitrine route', () => {
    const fixture = TestBed.createComponent(DesktopRestriction);
    const component = fixture.componentInstance;
    component['isDesktop'].set(true);
    component['currentUrl'].set('/vitrine');
    expect(component['isDesktopAppRoute']()).toBe(false);
  });

  it('should block app routes on desktop', () => {
    const fixture = TestBed.createComponent(DesktopRestriction);
    const component = fixture.componentInstance;
    component['isDesktop'].set(true);
    component['currentUrl'].set('/client/home');
    expect(component['isDesktopAppRoute']()).toBe(true);
  });
});
