import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PreferencePersistence } from './persistence';
import { PreferenceLogger } from './logger';
import { InMemoryAdapter } from '../../persistence/inMemoryAdapter';
import { UserEvent } from '../../../../packages/types/src/reco';
import { PersistenceAdapter } from '../../persistence/interface';
import { PersistenceAPI } from './persistence.api'; // Import the new interface

// Mock uuid globally for tests that might use it indirectly
vi.mock('uuid', () => {
  let counter = 0;
  return {
    v4: vi.fn(() => `mock-uuid-${++counter}`),
  };
});

describe('PreferencePersistence', () => {
  let persistence: PreferencePersistence;
  let mockAdapter: InMemoryAdapter<UserEvent>;

  beforeEach(() => {
    mockAdapter = new InMemoryAdapter<UserEvent>();
    persistence = new PreferencePersistence(mockAdapter);
    // Clear the adapter before each test
    // Access private property for testing, or add a clear method to InMemoryAdapter
    (mockAdapter as any).data = new Map();
    vi.clearAllMocks(); // Clear mocks for each test
  });

  it('should save a user event', async () => {
    const event: UserEvent = {
      userId: 'user1',
      eventType: 'VIEWED_OUTFIT',
      timestamp: new Date().toISOString(),
      payload: { outfitId: 'outfit1' },
    };
    const id = await persistence.saveEvent(event);
    expect(id).toBeDefined();
    const retrievedEvent = await persistence.getEventById(id);
    expect(retrievedEvent).toEqual({ ...event, id });
  });

  it('should retrieve all user events', async () => {
    const event1: UserEvent = { userId: 'user1', eventType: 'LIKED_ITEM', timestamp: '2023-01-01T00:00:00Z', payload: { itemId: 'item1' } };
    const event2: UserEvent = { userId: 'user2', eventType: 'SAVED_OUTFIT', timestamp: '2023-01-01T00:00:00Z', payload: { outfitId: 'outfit2' } };

    await persistence.saveEvent(event1);
    await persistence.saveEvent(event2);

    const allEvents = await persistence.getEvents();
    expect(allEvents).toHaveLength(2);
    expect(allEvents.some(e => e.userId === 'user1' && e.eventType === 'LIKED_ITEM')).toBe(true);
    expect(allEvents.some(e => e.userId === 'user2' && e.eventType === 'SAVED_OUTFIT')).toBe(true);
  });
});

describe('PreferenceLogger', () => {
  let logger: PreferenceLogger;
  let mockPersistenceInstance: any;

  beforeEach(() => {
    mockPersistenceInstance = {
      saveEvent: vi.fn(),
      getEvents: vi.fn(),
      getEventById: vi.fn(),
    };
    logger = new PreferenceLogger(mockPersistenceInstance);
  });

  it('should log an event with a timestamp', async () => {
    mockPersistenceInstance.saveEvent.mockResolvedValue('mock-event-id');

    const eventData = {
      userId: 'user1',
      eventType: 'VIEWED_OUTFIT' as const,
      payload: { outfitId: 'outfit1' },
    };
    const id = await logger.logEvent(eventData);

    expect(id).toBe('mock-event-id');
    expect(mockPersistenceInstance.saveEvent).toHaveBeenCalledTimes(1);
    const savedEvent = mockPersistenceInstance.saveEvent.mock.calls[0][0] as UserEvent;
    expect(savedEvent.userId).toBe('user1');
    expect(savedEvent.eventType).toBe('VIEWED_OUTFIT');
    expect(savedEvent.payload).toEqual({ outfitId: 'outfit1' });
    expect(savedEvent.timestamp).toBeDefined();
    expect(typeof savedEvent.timestamp).toBe('string');
  });

  it('should retrieve all logged events', async () => {
    const mockEvents: UserEvent[] = [
      { id: 'id1', userId: 'user1', eventType: 'LIKED_ITEM', timestamp: '2023-01-01T00:00:00Z', payload: { itemId: 'item1' } },
    ];
    mockPersistenceInstance.getEvents.mockResolvedValue(mockEvents);

    const events = await logger.getEvents();
    expect(events).toEqual(mockEvents);
    expect(mockPersistenceInstance.getEvents).toHaveBeenCalledTimes(1);
  });
});