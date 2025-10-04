import { LRUCache } from './lruCache';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(2);
  });

  it('should return undefined for a non-existent key', () => {
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should store and retrieve a value', () => {
    cache.put('key1', 1);
    expect(cache.get('key1')).toBe(1);
  });

  it('should move a retrieved key to the front', () => {
    cache.put('key1', 1);
    cache.put('key2', 2);
    cache.get('key1'); // key1 is now most recently used
    cache.put('key3', 3); // key2 should be evicted
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.get('key1')).toBe(1);
    expect(cache.get('key3')).toBe(3);
  });

  it('should evict the least recently used item when capacity is reached', () => {
    cache.put('key1', 1);
    cache.put('key2', 2);
    cache.put('key3', 3); // key1 should be evicted
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe(2);
    expect(cache.get('key3')).toBe(3);
  });

  it('should update the value of an existing key', () => {
    cache.put('key1', 1);
    cache.put('key1', 10);
    expect(cache.get('key1')).toBe(10);
  });
});
