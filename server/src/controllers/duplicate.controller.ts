import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { DuplicateInfoResponseDto, DuplicateResponseDto } from 'src/dtos/duplicate.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { DuplicateService } from 'src/services/duplicate.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Duplicates')
@Controller('duplicates')
export class DuplicateController {
  constructor(private service: DuplicateService) {}

  @Get()
  @Authenticated()
  getAssetDuplicates(@Auth() auth: AuthDto): Promise<DuplicateResponseDto[]> {
    return this.service.getDuplicates(auth);
  }

  @Get('info')
  @Authenticated()
  getAllDuplicatesInfo(@Auth() auth: AuthDto): Promise<DuplicateInfoResponseDto[]> {
    return this.service.getDuplicatesInfo(auth);
  }

  @Get(':id')
  @Authenticated()
  getDuplicateById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<DuplicateResponseDto> {
    return this.service.getDuplicateById(auth, id);
  }
}
