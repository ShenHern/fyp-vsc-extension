export type MessageType = 'view' | 'solve' | 'settings' | 'selectedSIM' | 'combineFiles' | 'eventArray';

export interface Message {
  type: MessageType;
  payload?: any;
}