import { Controller, Get, Header, MessageEvent, Param, Post, Sse } from '@nestjs/common';
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
  @Header('Content-Type', 'text/html')
  getHello(): string {
    return this.getWebSocketSamplePage();
  }

  private getWebSocketSamplePage(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSocket Sample</title>
  <script src="https://cdn.socket.io/4.8.0/socket.io.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.25rem; }
    .status { padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; }
    .status.connected { background: #d4edda; color: #155724; }
    .status.disconnected { background: #f8d7da; color: #721c24; }
    section { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
    input, button { padding: 0.5rem 0.75rem; margin-right: 0.5rem; margin-bottom: 0.5rem; }
    button { cursor: pointer; background: #0d6efd; color: #fff; border: none; border-radius: 6px; }
    button:hover { background: #0b5ed7; }
    #log { background: #f5f5f5; padding: 0.75rem; border-radius: 6px; font-family: monospace; font-size: 0.875rem; max-height: 200px; overflow-y: auto; }
    #log p { margin: 0.25rem 0; }
  </style>
</head>
<body>
  <h1>WebSocket Sample</h1>
  <div id="status" class="status disconnected">Disconnected</div>

  <section>
    <label>Ping / Pong</label>
    <button type="button" id="ping">Ping</button>
    <span id="pong-result"></span>
  </section>

  <section>
    <label>Echo</label>
    <input type="text" id="echo-input" placeholder="Type something" />
    <button type="button" id="echo">Echo</button>
    <span id="echo-result"></span>
  </section>

  <section>
    <label>Broadcast (all clients)</label>
    <input type="text" id="broadcast-input" placeholder="Message to broadcast" />
    <button type="button" id="broadcast">Broadcast</button>
  </section>

  <section>
    <label>Event log</label>
    <div id="log"></div>
  </section>

  <script>
    const statusEl = document.getElementById('status');
    const logEl = document.getElementById('log');
    const pongResult = document.getElementById('pong-result');
    const echoResult = document.getElementById('echo-result');
    const echoInput = document.getElementById('echo-input');
    const broadcastInput = document.getElementById('broadcast-input');

    function log(msg, type) {
      const p = document.createElement('p');
      p.textContent = (type ? '[' + type + '] ' : '') + msg;
      logEl.appendChild(p);
      logEl.scrollTop = logEl.scrollHeight;
    }

    const socket = io(window.location.origin);

    socket.on('connect', function () {
      statusEl.textContent = 'Connected';
      statusEl.className = 'status connected';
      log('Connected to server');
    });

    socket.on('disconnect', function () {
      statusEl.textContent = 'Disconnected';
      statusEl.className = 'status disconnected';
      log('Disconnected');
    });

    socket.on('connect_error', function (err) {
      log('Connection error: ' + err.message, 'error');
    });

    socket.on('pong', function (data) {
      pongResult.textContent = 'Pong at ' + (data && data.timestamp ? new Date(data.timestamp).toISOString() : '');
      log('Pong: ' + JSON.stringify(data));
    });

    socket.on('echo', function (data) {
      echoResult.textContent = 'Echo: ' + JSON.stringify(data);
      log('Echo: ' + JSON.stringify(data));
    });

    socket.on('broadcast', function (data) {
      log('Broadcast: ' + (data && data.message != null ? data.message : JSON.stringify(data)), 'broadcast');
    });

    document.getElementById('ping').addEventListener('click', function () {
      socket.emit('ping');
      log('Sent ping');
    });

    document.getElementById('echo').addEventListener('click', function () {
      const value = echoInput.value.trim() || '(empty)';
      socket.emit('echo', value);
      log('Sent echo: ' + value);
    });

    document.getElementById('broadcast').addEventListener('click', function () {
      const message = broadcastInput.value.trim() || 'Hello everyone!';
      socket.emit('broadcast', { message: message });
      log('Sent broadcast: ' + message);
    });
  </script>
</body>
</html>`;
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
