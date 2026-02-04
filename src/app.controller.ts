import { Controller, Get, MessageEvent, Sse } from '@nestjs/common';
import { AppService } from './app.service';
import { Observable } from 'rxjs';

interface Quote {
  index: number;
  quote: string;
}

@Controller()
export class AppController {

  static quotes = [
    'We are gonna need a bigger boat.',
    'I see dead people.',
    'We are gonna need another Timmy.',
    'Have you seen my stapler?',
    'Hasta la vista, baby.',
    'Your mother was a hamster and your father smelt of elderberries.',
    'I am your father.',
    'Nooo!.',
  ];

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('test')
  getTest(): string {
    return 'test';
  }
  @Sse('quotes/sse')
  public getQuotesSSE(): Observable<MessageEvent> {
    console.log('getQuotesSSE called');
    return new Observable((observer) => {
      console.log('start');
      observer.next({ data: 'start' });

      const promises = AppController.quotes.map((quote, index) =>
        this.sendQuote(quote, index).then((q: string) => observer.next({ data: q })),
      );
      Promise.allSettled(promises).then((results) => {
        console.log('all quotes sent');
        observer.complete();
        // console.log(results);
        results.filter((result) => result.status === 'rejected').forEach((result) => {
          console.log('rejected', result.reason.cause);
        });
      });
    });
  }

  private async sendQuote(quote: string, index: number): Promise<string> {
    if (quote === 'I see dead people.') {
      throw new Error('I see dead people.', { cause: { index, quote } });
    }
    // do some work
    await new Promise((resolve) => setTimeout(resolve, quote.length * 100));

    // return the quote as json
    return JSON.stringify({ index, quote });
  }
}
