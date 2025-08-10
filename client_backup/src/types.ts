export type Mode =
  | 'options' | 'chat' | 'availability' | 'create' | 'createCustomer'
  | 'get' | 'update' | 'cancel';

export interface Message {
  from: 'user' | 'agent';
  text: string;
}

export interface Booking {
  booking_reference: string;
  visit_date: string;
  visit_time: string;
  party_size: number;
}

export interface ChipOffer {
  date: string;
  partySize: number;
  times: string[];
}
