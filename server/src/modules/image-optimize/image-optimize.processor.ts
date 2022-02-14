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

@Processor('optimize')
export class ImageOptimizeProcessor {
  constructor(
    private wsCommunicateionGateway: CommunicationGateway,
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  @Process('resize-image')
  async resizeUploadedImage(job: Job) {
    const { savedAsset }: { savedAsset: AssetEntity } = job.data;

    const basePath = APP_UPLOAD_LOCATION;
    const resizePath = savedAsset.originalPath.replace('/original/', '/thumb/');

    // Create folder for thumb image if not exist

    const resizeDir = `${basePath}/${savedAsset.userId}/thumb/${savedAsset.deviceId}`;

    if (!existsSync(resizeDir)) {
      mkdirSync(resizeDir, { recursive: true });
    }

    readFile(savedAsset.originalPath, async (err, data) => {
      if (err) {
        console.error('Error Reading File');
      }

      if (savedAsset.mimeType == 'image/heic' || savedAsset.mimeType == 'image/heif') {
        let desitnation = '';
        if (savedAsset.mimeType == 'image/heic') {
          desitnation = resizePath.replace('.HEIC', '.jpeg');
        } else {
          desitnation = resizePath.replace('.HEIF', '.jpeg');
        }

        sharp(data)
          .toFormat('jpeg')
          .resize(512, 512, { fit: 'outside' })
          .toFile(desitnation, async (err, info) => {
            if (err) {
              console.error('Error resizing file ', err);
              return;
            }

            const res = await this.assetRepository.update(savedAsset, { resizePath: desitnation });
            if (res.affected) {
              this.wsCommunicateionGateway.server
                .to(savedAsset.userId)
                .emit('on_upload_success', JSON.stringify(savedAsset));
            }
          });
      } else {
        sharp(data)
          .resize(512, 512, { fit: 'outside' })
          .toFile(resizePath, async (err, info) => {
            if (err) {
              console.error('Error resizing file ', err);
              return;
            }

            const res = await this.assetRepository.update(savedAsset, { resizePath: resizePath });
            if (res.affected) {
              this.wsCommunicateionGateway.server
                .to(savedAsset.userId)
                .emit('on_upload_success', JSON.stringify(savedAsset));
            }
          });
      }
    });

    return 'ok';
  }

  @Process('get-video-thumbnail')
  async resizeUploadedVideo(job: Job) {
    const { savedAsset, filename }: { savedAsset: AssetEntity; filename: String } = job.data;

    const basePath = APP_UPLOAD_LOCATION;
    // const resizePath = savedAsset.originalPath.replace('/original/', '/thumb/');
    // Create folder for thumb image if not exist
    const resizeDir = `${basePath}/${savedAsset.userId}/thumb/${savedAsset.deviceId}`;

    if (!existsSync(resizeDir)) {
      mkdirSync(resizeDir, { recursive: true });
    }

    ffmpeg(savedAsset.originalPath)
      .thumbnail({
        count: 1,
        timestamps: [1],
        folder: resizeDir,
        filename: `${filename}.png`,
      })
      .on('end', async (a) => {
        const res = await this.assetRepository.update(savedAsset, { resizePath: `${resizeDir}/${filename}.png` });
        if (res.affected) {
          this.wsCommunicateionGateway.server
            .to(savedAsset.userId)
            .emit('on_upload_success', JSON.stringify(savedAsset));
        }
      });

    return 'ok';
  }
}
