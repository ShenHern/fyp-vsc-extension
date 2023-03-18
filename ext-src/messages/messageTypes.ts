export type MessageType = 'view' | 'solve' | 'settings';

export interface Message {
  type: MessageType;
  payload?: any;
}

export interface CommonMessage extends Message {
  type: 'settings';
  payload: any;
}

export interface ReloadMessage extends Message {
  type: 'solve';
}