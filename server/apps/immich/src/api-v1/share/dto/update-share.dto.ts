import { PartialType } from '@nestjs/swagger';
import { CreateShareDto } from './create-share.dto';

export class UpdateShareDto extends PartialType(CreateShareDto) {}
