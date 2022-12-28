import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { SharedLinkEntity, SharedLinkType } from '@app/database/entities/shared-link.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { AlbumEntity } from '@app/database/entities/album.entity';

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
    const asset1 = await this.assetRepository.findOne({ where: { id: '55cc85ba-61be-4011-94b0-590254015d70' } });

    if (!asset1) {
      return;
    }

    const asset2 = await this.assetRepository.findOne({ where: { id: 'a04e3a13-10f5-4196-b5d2-fc4904ff7cfc' } });

    if (!asset2) {
      return;
    }

    const sharedLink = new SharedLinkEntity();

    sharedLink.key = '1234567890';
    sharedLink.description = 'test-shared-assets';
    sharedLink.userId = 'd2105c28-4821-4c19-97e3-f568976967ba';
    sharedLink.type = SharedLinkType.INDIVIDUAL;
    sharedLink.createdAt = new Date().toISOString();
    sharedLink.expiresAt = new Date().toISOString();
    sharedLink.assets = [asset1, asset2];

    const ret = await this.sharedLinkRepository.save(sharedLink);

    return ret;
  }

  @Get()
  async findAll() {
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
  remove(@Param('id') id: string) {
    return this.shareService.remove(+id);
  }
}
