import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Authenticated()
  @Post()
  async create(@Body(ValidationPipe) createSharedLinkDto: CreateShareDto, @GetAuthUser() authUser: AuthUserDto) {
    return this.shareService.createSharedLink(authUser, createSharedLinkDto);
  }

  @Get()
  async findAll() {
    // const a = await this.assetRepository.findOne({
    //   where: { id: 'a04e3a13-10f5-4196-b5d2-fc4904ff7cfc' },
    //   relations: { sharedLinks: true },
    // });
    // console.log('aset', a);
    // const ret = await this.sharedLinkRepository.find({
    //   relations: {
    //     assets: true,
    //   },
    // });
    // return ret;
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
    // const link = await this.sharedLinkRepository.findOne({ where: { id } });
    // if (!link) {
    //   return;
    // }
    // return this.sharedLinkRepository.remove(link);
  }
}
