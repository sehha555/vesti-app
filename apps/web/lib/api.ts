import { UserEvent } from '@/packages/types/src/reco';

/**
 * Logs a user interaction event to the recommendation service.
 * @param event - The event data to log.
 */
export const logInteractionEvent = async (event: Omit<UserEvent, 'timestamp' | 'id'>) => {
  try {
    const response = await fetch('/api/reco/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error('Failed to log event', await response.json());
    }
  } catch (error) {
    console.error('Error logging interaction event:', error);
  }
};
