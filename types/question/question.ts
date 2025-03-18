export interface Question {
  _id: string;
  question: string;
  options: Option[];
}

interface Option {
  _id: string;
  option: string;
  point: number;
}