
export enum TransactionType {
  RECEIVABLE = 'RECEIVABLE', // Lena Hai
  PAYABLE = 'PAYABLE',      // Dena Hai
}

export interface Transaction {
  id: string;
  contactName: string;
  amount: number;
  date: string;
  note: string;
  type: TransactionType;
}

export type Language = 'EN' | 'RU'; // English, Roman Urdu

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Dictionary {
  [key: string]: {
    EN: string;
    RU: string;
  };
}
