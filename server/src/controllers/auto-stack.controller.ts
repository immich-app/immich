import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { AutoStackCandidateResponseDto } from 'src/dtos/auto-stack.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AutoStackService } from 'src/services/auto-stack.service';
import { StackService } from 'src/services/stack.service';

class PromoteCandidateDto {
  primaryAssetId?: string;
}

@ApiTags('AutoStack')
@Controller('auto-stack')
export class AutoStackController {
  constructor(
    private autoStack: AutoStackService,
    private stackService: StackService,
  ) {}

  @Get('candidates')
  @ApiOkResponse({ type: [AutoStackCandidateResponseDto] })
  @Authenticated({ permission: Permission.StackRead })
  listCandidates(@Auth() auth: AuthDto) {
    return this.autoStack.listCandidates(auth.user.id) as any as AutoStackCandidateResponseDto[];
  }

  @Get('candidates/score-stats')
  @Authenticated({ permission: Permission.StackRead })
  async getScoreStats(@Auth() auth: AuthDto) {
    return this.autoStack.getScoreDistribution(auth.user.id);
  }

  @Post('candidates/:candidateId/promote')
  @Authenticated({ permission: Permission.StackCreate })
  async promote(
    @Auth() auth: AuthDto,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() dto: PromoteCandidateDto,
  ) {
    return this.autoStack.promoteCandidate(auth, candidateId, dto.primaryAssetId);
  }

  @Delete('candidates/:candidateId')
  @Authenticated({ permission: Permission.StackDelete })
  discard(@Auth() auth: AuthDto, @Param('candidateId', ParseUUIDPipe) candidateId: string) {
    return this.autoStack.dismissCandidate(auth, candidateId);
  }

  @Post('candidates/:candidateId/rescore')
  @Authenticated({ permission: Permission.StackUpdate })
  async rescore(@Auth() auth: AuthDto, @Param('candidateId', ParseUUIDPipe) candidateId: string) {
    return this.autoStack.rescoreCandidate(auth, candidateId);
  }

  @Post('reset')
  @Authenticated({ permission: Permission.StackUpdate })
  async resetAll(@Auth() auth: AuthDto) {
    return this.autoStack.resetAll(auth);
  }
}
