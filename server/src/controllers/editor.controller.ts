import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { EditorCreateAssetDto } from 'src/dtos/editor.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { EditorService } from 'src/services/editor.service';

@ApiTags('Editor')
@Controller('editor')
export class EditorController {
  constructor(private service: EditorService) {}

  @Post()
  @Authenticated()
  createAssetFromEdits(@Auth() auth: AuthDto, @Body() dto: EditorCreateAssetDto): Promise<AssetResponseDto> {
    return this.service.createAssetFromEdits(auth, dto);
  }
}
