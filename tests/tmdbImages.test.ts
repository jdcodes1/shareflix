import { describe, it, expect } from 'vitest';
import { getPosterUrl, getBackdropUrl, ImageSizes } from '../src/services/tmdb';

describe('getPosterUrl', () => {
  it('builds a medium (w500) poster URL by default', () => {
    expect(getPosterUrl('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
  });

  it('honors an explicit size', () => {
    expect(getPosterUrl('/abc.jpg', 'small')).toBe(`${ImageSizes.poster.small}/abc.jpg`);
    expect(getPosterUrl('/abc.jpg', 'large')).toBe(`${ImageSizes.poster.large}/abc.jpg`);
  });

  it('falls back to a placeholder for a null path', () => {
    expect(getPosterUrl(null)).toContain('placeholder');
  });
});

describe('getBackdropUrl', () => {
  it('builds a large (original) backdrop URL by default', () => {
    expect(getBackdropUrl('/bd.jpg')).toBe('https://image.tmdb.org/t/p/original/bd.jpg');
  });

  it('falls back to a placeholder for a null path', () => {
    expect(getBackdropUrl(null)).toContain('placeholder');
  });
});
