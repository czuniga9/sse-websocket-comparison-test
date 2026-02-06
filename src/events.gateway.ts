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

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() _data: unknown, @ConnectedSocket() client: any) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  @SubscribeMessage('echo')
  handleEcho(@MessageBody() data: unknown, @ConnectedSocket() client: any) {
    return { event: 'echo', data };
  }

  @SubscribeMessage('broadcast')
  handleBroadcast(@MessageBody() data: { message: string }) {
    this.server.emit('broadcast', data);
  }
}
