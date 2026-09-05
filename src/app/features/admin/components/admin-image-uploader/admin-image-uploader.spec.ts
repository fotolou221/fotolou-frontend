import { TestBed } from '@angular/core/testing';
import { AdminImageUploader } from './admin-image-uploader';

describe('AdminImageUploader', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminImageUploader]
    }).compileComponents();
  });

  it('should create the admin image uploader component', () => {
    const fixture = TestBed.createComponent(AdminImageUploader);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should select preset and emit change', () => {
    const fixture = TestBed.createComponent(AdminImageUploader);
    const component = fixture.componentInstance;
    let emittedUrl = '';
    component.imageUrlChange.subscribe(url => emittedUrl = url);

    component['selectPreset']('https://example.com/test.jpg');
    expect(component.imageUrl).toBe('https://example.com/test.jpg');
    expect(emittedUrl).toBe('https://example.com/test.jpg');
  });

  it('should remove image and emit empty string', () => {
    const fixture = TestBed.createComponent(AdminImageUploader);
    const component = fixture.componentInstance;
    component.imageUrl = 'https://example.com/test.jpg';
    let emittedUrl = 'initial';
    component.imageUrlChange.subscribe(url => emittedUrl = url);

    component['removeImage']();
    expect(component.imageUrl).toBe('');
    expect(emittedUrl).toBe('');
  });
});
