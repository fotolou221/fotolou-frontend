import { TestBed } from '@angular/core/testing';
import { InstallBanner } from './install-banner';
import { PwaService } from '../../services/pwa.service';

describe('InstallBanner', () => {
  let pwaService: PwaService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstallBanner],
      providers: [PwaService]
    }).compileComponents();

    pwaService = TestBed.inject(PwaService);
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(InstallBanner);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render popup when showBanner signal is true', () => {
    pwaService.showBanner.set(true);
    const fixture = TestBed.createComponent(InstallBanner);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.install-popup')).toBeTruthy();
    expect(compiled.textContent).toContain('Installer');
  });

  it('should not render popup when showBanner signal is false', () => {
    pwaService.showBanner.set(false);
    const fixture = TestBed.createComponent(InstallBanner);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.install-popup')).toBeFalsy();
  });
});
