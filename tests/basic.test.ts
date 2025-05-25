import { describe, it, expect } from 'vitest';
import { Element, CardType, CardRarity } from '../src/types/Card';

// Basic tests to validate Vitest configuration
describe('Basic Test Suite', () => {
  it('should verify that Vitest is working', () => {
    expect(true).toBe(true);
  });

  it('should verify that imports from project files work', () => {
    expect(Element.Fire).toBe('Fire');
    expect(CardType.Minion).toBe('Minion');
    expect(CardRarity.Ordinary).toBe('Ordinary');
  });
  
  it('should handle simple calculations', () => {
    expect(1 + 1).toBe(2);
    expect('hello' + ' world').toBe('hello world');
  });
});
