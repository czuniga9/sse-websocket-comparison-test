import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AppService } from './app.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly appService: AppService) {}

  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('pollQuotes')
  async handleStartQuotes(
    @MessageBody() payload: Record<string, unknown> | string,
    @ConnectedSocket() client: any,
  ) {
    const initialData = payload ?? null;
    if (!initialData) {
      this.logger.warn('No payload provided');
      client.disconnect(true);
      return;
    }

    client.emit('data', initialData);

    const promises = this.appService.quotes.map(async (quote, index) => {
      try {
        const result = await this.appService.sendQuote(quote, index);
        client.emit('quote', result);
      } catch (err) {
        this.logger.warn(`Quote failed: ${(err as Error).cause}`);
      }
    });

    await Promise.allSettled(promises);
    this.logger.log(`All quotes sent for client ${client.id}, closing connection`);
    client.disconnect(true);
  }
}
