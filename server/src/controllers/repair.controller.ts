import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { RepairEntity } from 'src/entities/repair.entity';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { RepairService } from 'src/services/repair.service';

@ApiTags('Repairs')
@Controller('repairs')
export class RepairController {
  constructor(private service: RepairService) {}

  @Get()
  @Authenticated({ admin: true })
  getRepairs(@Auth() auth: AuthDto): Promise<RepairEntity[]> {
    return this.service.getRepairs(auth);
  }

  @Post('/check')
  @Authenticated({ admin: true })
  validateChecksums(@Auth() auth: AuthDto): Promise<RepairEntity[]> {
    return this.service.getRepairs(auth);
  }
}
