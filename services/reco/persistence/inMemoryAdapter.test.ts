import { InMemoryAdapter } from './inMemoryAdapter';

// Mock the uuid module
jest.mock('uuid', () => {
  let counter = 0;
  return {
    v4: jest.fn(() => `mock-uuid-${++counter}`), // Provide a mock implementation for v4
  };
});

describe('InMemoryAdapter', () => {
  interface TestData { id?: string; name: string; value: number; }
  let adapter: InMemoryAdapter<TestData>;

  beforeEach(() => {
    adapter = new InMemoryAdapter<TestData>();
  });

  it('should save data and assign an ID if not provided', async () => {
    const data: TestData = { name: 'test1', value: 10 };
    const id = await adapter.save(data);
    expect(id).toBeDefined();
    expect(data.id).toBeDefined(); // Add this line
    expect(data.id).toBe(id);
    const retrieved = await adapter.findById(id);
    expect(retrieved).toEqual(data);
  });

  it('should save data with a provided ID', async () => {
    const data: TestData = { id: 'custom-id', name: 'test2', value: 20 };
    const id = await adapter.save(data);
    expect(id).toBe('custom-id');
    const retrieved = await adapter.findById('custom-id');
    expect(retrieved).toEqual(data);
  });

  it('should find data by ID', async () => {
    const data1: TestData = { name: 'test3', value: 30 };
    const id1 = await adapter.save(data1);
    const data2: TestData = { name: 'test4', value: 40 };
    const id2 = await adapter.save(data2);

    const retrieved1 = await adapter.findById(id1);
    expect(retrieved1).toEqual(data1);
    const retrieved2 = await adapter.findById(id2);
    expect(retrieved2).toEqual(data2);
  });

  it('should return undefined if ID is not found', async () => {
    const retrieved = await adapter.findById('non-existent-id');
    expect(retrieved).toBeUndefined();
  });

  it('should find all saved data', async () => {
    const data1: TestData = { name: 'test5', value: 50 };
    await adapter.save(data1);
    const data2: TestData = { name: 'test6', value: 60 };
    await adapter.save(data2);

    const allData = await adapter.findAll();
    expect(allData).toHaveLength(2);
    expect(allData).toContainEqual(data1);
    expect(allData).toContainEqual(data2);
  });
});