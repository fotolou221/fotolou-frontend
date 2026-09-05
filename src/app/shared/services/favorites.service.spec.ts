import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FavoritesService } from './favorites.service';
import { SalonService } from './salon.service';
import { Salon } from '../models/salon';

describe('FavoritesService', () => {
  let service: FavoritesService;

  const mockSalon: Salon = {
    id: 'test-salon',
    name: 'Salon Test',
    location: 'Dakar',
    district: 'Plateau',
    status: 'open',
    peopleWaiting: 3,
    avatarUrl: '',
    coverUrl: '',
    galleryImages: [],
    phone: '',
    actions: []
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        FavoritesService,
        SalonService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(FavoritesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle favorite status', () => {
    const isNowFav = service.toggleFavorite(mockSalon);
    expect(isNowFav).toBe(true);
    expect(service.isFavorite('test-salon')).toBe(true);

    const isStillFav = service.toggleFavorite(mockSalon);
    expect(isStillFav).toBe(false);
    expect(service.isFavorite('test-salon')).toBe(false);
  });

  it('should add and remove favorite', () => {
    service.addFavorite('custom-id');
    expect(service.isFavorite('custom-id')).toBe(true);

    service.removeFavorite('custom-id');
    expect(service.isFavorite('custom-id')).toBe(false);
  });
});
