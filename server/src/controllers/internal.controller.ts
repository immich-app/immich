import { Body, Controller, NotFoundException, Post, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { AppRestartEvent, EventRepository } from 'src/repositories/event.repository';

const LOCALHOST_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

@ApiExcludeController()
@Controller('internal')
export class InternalController {
  constructor(private eventRepository: EventRepository) {}

  @Post('restart')
  async restart(@Req() req: Request, @Body() dto: AppRestartEvent): Promise<void> {
    const remoteAddress = req.socket.remoteAddress;
    if (!remoteAddress || !LOCALHOST_ADDRESSES.has(remoteAddress)) {
      throw new NotFoundException();
    }

    await this.eventRepository.emit('AppRestart', dto);
  }
}
