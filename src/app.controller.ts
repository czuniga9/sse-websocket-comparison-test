import { Controller, Get, Header, MessageEvent, Param, Post, Res, Sse } from '@nestjs/common';
import { AppService } from './app.service';
import { Observable } from 'rxjs';
import { Body } from '@nestjs/common';

@Controller()
export class AppController {
  data: Record<string, any> = {};

  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getHello(@Res() res: any): string {
    return res.render('demo', {
      title: "Demo",
      FooterJs: "",
      layout: false,
    });
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
    const data = this.data[key] || 'no data';

    return new Observable((observer) => {
      observer.next({ 'data': {message:'original payload', data} });

      const promises = this.appService.quotes.map((quote, index) =>
        this.appService.sendQuote(quote, index).then((q: string) => observer.next({ data: q })),
      );

      Promise.allSettled(promises).then((results) => {
        observer.next({ data: 'end' });
        observer.complete();
        results.filter((result) => result.status === 'rejected').forEach((result) => {
          // log errors
          console.log('>>> rejected', result.reason.cause);
        });
      });
    });
  }
}
