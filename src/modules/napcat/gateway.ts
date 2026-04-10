import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { NapCatService } from './service';
import { NapCatMessage } from './interfaces/message';

@WebSocketGateway({
  cors: true,
  path: '/napcat',
})
export class NapCatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NapCatGateway.name);

  constructor(private readonly napCatService: NapCatService) {}

  afterInit(server: Server): void {
    this.logger.log('NapCat WebSocket 网关初始化完成');
  }

  handleConnection(client: WebSocket): void {
    this.logger.log('NapCat 客户端已连接');
    this.napCatService.setActiveClient(client);

    const messageHandler = (data: Buffer) => {
      try {
        const raw = JSON.parse(data.toString()) as unknown;
        const message = raw as NapCatMessage;

        this.logger.debug(`收到 NapCat 消息: ${JSON.stringify(message)}`);
        this.napCatService.handleIncomingMessage(message, client);
      } catch (error) {
        this.logger.error(`解析消息失败: ${(error as Error).message}`);
      }
    };

    client.on('message', messageHandler);

    client.once('close', () => {
      client.removeListener('message', messageHandler);
    });
  }

  handleDisconnect(client: WebSocket): void {
    this.logger.log('NapCat 客户端已断开');
    this.napCatService.clearActiveClient();
  }
}
