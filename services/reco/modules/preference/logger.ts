import { UserEvent } from '../../../../packages/types/src/reco';
import { preferencePersistence as defaultPreferencePersistence } from './persistence';
import { PersistenceAPI } from './persistence.api'; // Import the new interface

export class PreferenceLogger {
  private persistence: PersistenceAPI; // Change type to PersistenceAPI

  constructor(persistence: PersistenceAPI = defaultPreferencePersistence) { // Change type to PersistenceAPI
    this.persistence = persistence;
  }

  async logEvent(event: Omit<UserEvent, 'timestamp' | 'id'>): Promise<string> {
    const fullEvent: UserEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    return this.persistence.saveEvent(fullEvent);
  }

  async getEvents(): Promise<UserEvent[]> {
    return this.persistence.getEvents();
  }
}

export const preferenceLogger = new PreferenceLogger();
