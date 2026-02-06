import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  readonly quotes = [
    'We are gonna need a bigger boat.',
    'I see dead people.',
    'We are gonna need another Timmy.',
    'Have you seen my stapler?',
    'Hasta la vista, baby.',
    'Your mother was a hamster and your father smelt of elderberries.',
    'I am your father.',
    'Nooo!.',
  ];

  async sendQuote(quote: string, index: number): Promise<string> {
    if (quote.includes('dead')) {
      throw new Error('Dead quote', { cause: { index, quote } });
    }
    await new Promise((resolve) => setTimeout(resolve, quote.length * 100));
    return JSON.stringify({ index, quote });
  }
}
