import { Injectable } from '@nestjs/common';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdateShareDto } from './dto/update-share.dto';

@Injectable()
export class ShareService {
  create(createShareDto: CreateShareDto) {
    return 'This action adds a new share';
  }

  findAll() {
    return `This action returns all share`;
  }

  findOne(id: number) {
    return `This action returns a #${id} share`;
  }

  update(id: number, updateShareDto: UpdateShareDto) {
    return `This action updates a #${id} share`;
  }

  remove(id: number) {
    return `This action removes a #${id} share`;
  }
}
