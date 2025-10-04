// services/reco/modules/preference/persistence.api.ts
import { UserEvent } from '../../../../packages/types/src/reco';

/**
 * Public API interface for preference persistence.
 * Does not expose private implementation details like adapter.
 */
export interface PersistenceAPI {
  saveEvent(event: UserEvent): Promise<string>;
  getEvents(): Promise<UserEvent[]>;
  getEventById(id: string): Promise<UserEvent | undefined>;
}