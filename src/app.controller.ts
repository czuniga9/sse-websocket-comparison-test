import { Controller, Get, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { AppService } from './app.service';
import { Observable } from 'rxjs';
import { Body } from '@nestjs/common';

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

  data: Record<string, any> = {};

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('data')
  postData(@Body() data: Record<string, any>): string {
    const key = Math.floor(Math.random() * 100).toString();
    console.log(data);
    this.data[key] = data;
    return key;
  }

  @Sse('quotes/sse/:key')
  public getQuotesSSE(@Param('key') key: string): Observable<MessageEvent> {
    console.log(this.data);
    const data = this.data[key] || 'no data';

    // console.log('>>> getQuotesSSE called');
    return new Observable((observer) => {
      console.log('>>> start');
      observer.next({ 'data': data });

      const promises = AppController.quotes.map((quote, index) =>
        this.sendQuote(quote, index).then((q: string) => observer.next({ data: q })),
      );
      Promise.allSettled(promises).then((results) => {
        console.log('>>> all quotes sent');
        observer.complete();
        // console.log(results);
        results.filter((result) => result.status === 'rejected').forEach((result) => {
          // log any errors
          console.log('>>> rejected', result.reason.cause);
        });
      });
    });
  }

  private async sendQuote(quote: string, index: number): Promise<string> {
    if (quote.includes('dead')) {
      throw new Error('Dead quote', { cause: { index, quote } });
    }
    // do some work
    await new Promise((resolve) => setTimeout(resolve, quote.length * 100));

    // return the quote as json
    return JSON.stringify({ index, quote });
  }
}
