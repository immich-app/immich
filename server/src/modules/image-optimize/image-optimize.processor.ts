import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import sharp from 'sharp';
import { existsSync, mkdirSync, readFile } from 'fs';
import { ConfigService } from '@nestjs/config';
import ffmpeg from 'fluent-ffmpeg';
import { APP_UPLOAD_LOCATION } from '../../constants/upload_location.constant';
import { WebSocketServer } from '@nestjs/websockets';
import { Socket, Server as SocketIoServer } from 'socket.io';
import { CommunicationGateway } from '../../api-v1/communication/communication.gateway';
import { BackgroundTaskService } from '../background-task/background-task.service';

@Processor('optimize')
export class ImageOptimizeProcessor {
  constructor(
    private wsCommunicateionGateway: CommunicationGateway,
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    private backgroundTaskService: BackgroundTaskService,
  ) {}
}
