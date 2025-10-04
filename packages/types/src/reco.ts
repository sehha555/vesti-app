export interface UserEvent {
  id?: string; // Added id property
  userId: string;
  eventType: 'VIEWED_OUTFIT' | 'LIKED_ITEM' | 'DISLIKED_ITEM' | 'SAVED_OUTFIT' | 'TRIED_ON_ITEM' | 'ADD_TO_CART' | 'CLICKED_ITEM';
  timestamp: string;
  payload: Record<string, any>; // Flexible payload for event-specific data
}
