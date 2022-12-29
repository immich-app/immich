import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { SharedLinkEntity, SharedLinkType } from '@app/database/entities/shared-link.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { AlbumEntity } from '@app/database/entities/album.entity';
import crypto from 'node:crypto';

@Controller('share')
export class ShareController {
  constructor(
    private readonly shareService: ShareService,
    @InjectRepository(SharedLinkEntity)
    private readonly sharedLinkRepository: Repository<SharedLinkEntity>,

    @InjectRepository(AssetEntity)
    private readonly assetRepository: Repository<AssetEntity>,

    @InjectRepository(AlbumEntity)
    private readonly albumRepository: Repository<AlbumEntity>,
  ) {}

  @Post()
  async create(@Body() createShareDto: CreateShareDto) {
    const asset1 = await this.assetRepository.findOne({ where: { id: 'e79ebeae-7f5f-48c3-94ca-c0ca5b43831d' } });

    if (!asset1) {
      return;
    }

    const asset2 = await this.assetRepository.findOne({ where: { id: 'cd2eeb01-9d7e-4b24-b6d6-17d0b5753bfe' } });

    if (!asset2) {
      return;
    }

    const sharedLink = new SharedLinkEntity();
    sharedLink.id = crypto.randomBytes(70).toString('hex');
    sharedLink.key = crypto.randomBytes(40).toString('hex');
    sharedLink.description = 'test-shared-assets';
    sharedLink.userId = '43ba277d-2bdb-4ae8-97f2-668efccf02c1';
    sharedLink.type = SharedLinkType.INDIVIDUAL;
    sharedLink.createdAt = new Date().toISOString();
    sharedLink.expiresAt = new Date().toISOString();
    sharedLink.assets = [asset1, asset2];

    const ret = await this.sharedLinkRepository.save(sharedLink);

    return ret;
  }

  @Get()
  async findAll() {
    const a = await this.assetRepository.findOne({
      where: { id: 'a04e3a13-10f5-4196-b5d2-fc4904ff7cfc' },
      relations: { sharedLinks: true },
    });
    console.log('aset', a);
    const ret = await this.sharedLinkRepository.find({
      relations: {
        assets: true,
      },
    });
    return ret;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shareService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShareDto: UpdateShareDto) {
    return this.shareService.update(+id, updateShareDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const link = await this.sharedLinkRepository.findOne({ where: { id } });
    if (!link) {
      return;
    }
    return this.sharedLinkRepository.remove(link);
  }
}
