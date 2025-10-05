import { describe, it, expect, vi } from 'vitest';
import httpMocks from 'node-mocks-http';
import eventLoggerHandler from './route';
import { preferenceLogger } from '../../modules/preference/logger';

// Mock the preferenceLogger to avoid actual logging
vi.mock('../../modules/preference/logger', () => ({
  preferenceLogger: {
    logEvent: vi.fn(),
  },
}));

describe('Event Logger API Endpoint', () => {
  it('should return 405 Method Not Allowed for non-POST requests', async () => {
    const { req, res } = httpMocks.createMocks({
      method: 'GET',
    });

    await eventLoggerHandler(req, res);

    expect(res.statusCode).toBe(405);
  });

  it('should return 400 Bad Request if required fields are missing', async () => {
    const { req, res } = httpMocks.createMocks({
      method: 'POST',
      body: {
        userId: 'test-user',
        // eventType is missing
        payload: { itemId: 'item-123' },
      },
    });

    await eventLoggerHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Request body must include userId, eventType, and payload.' });
  });

  it('should return 201 Created and log the event for a valid request', async () => {
    const eventData = {
      userId: 'test-user',
      eventType: 'CLICKED_ITEM' as const,
      payload: { itemId: 'item-123', page: 'daily_outfits' },
    };

    const { req, res } = httpMocks.createMocks({
      method: 'POST',
      body: eventData,
    });

    // Mock the return value of logEvent
    (preferenceLogger.logEvent as any).mockResolvedValue('mock-event-id');

    await eventLoggerHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._getJSONData()).toEqual({ message: 'Event logged successfully', eventId: 'mock-event-id' });
    expect(preferenceLogger.logEvent).toHaveBeenCalledWith(eventData);
    expect(preferenceLogger.logEvent).toHaveBeenCalledTimes(1);
  });
});