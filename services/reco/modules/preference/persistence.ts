import { InMemoryAdapter } from '../../persistence/inMemoryAdapter';
import { UserEvent } from '../../../../packages/types/src/reco';
import { PersistenceAdapter } from '../../persistence/interface';
import { PersistenceAPI } from './persistence.api'; // Import the new interface

export class PreferencePersistence implements PersistenceAPI { // Implement PersistenceAPI
  private adapter: PersistenceAdapter<UserEvent>;

  constructor(adapter: PersistenceAdapter<UserEvent>) {
    this.adapter = adapter;
  }

  async saveEvent(event: UserEvent): Promise<string> {
    return this.adapter.save(event);
  }

  async getEvents(): Promise<UserEvent[]> {
    return this.adapter.findAll();
  }

  async getEventById(id: string): Promise<UserEvent | undefined> {
    return this.adapter.findById(id);
  }
}

// Export an instance for convenience, using the InMemoryAdapter
export const preferencePersistence = new PreferencePersistence(new InMemoryAdapter<UserEvent>());
