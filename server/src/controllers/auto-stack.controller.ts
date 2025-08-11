import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { AutoStackCandidateResponseDto } from 'src/dtos/auto-stack.dto';
import { StackCreateDto } from 'src/dtos/stack.dto';
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
    const { server } = await (this.autoStack as any).getConfig({ withCache: true });
    if (!server.autoStack.enabled) return { error: 'disabled' };
    const candidates = await this.autoStack.listCandidates(auth.user.id);
    const candidate = candidates.find((c: any) => c.id === candidateId);
    if (!candidate) return { error: 'not-found' };
    const assetIds = candidate.assets.map((a: any) => a.assetId);
    const primary = dto.primaryAssetId && assetIds.includes(dto.primaryAssetId) ? dto.primaryAssetId : assetIds[0];
    const createDto: StackCreateDto = { assetIds };
    const stack = await this.stackService.create(auth, createDto);
    if (primary !== stack.primaryAssetId) {
      await this.stackService.update(auth, stack.id, { primaryAssetId: primary });
    }
    await (this.autoStack as any).autoStackCandidateRepository.promote(candidateId, auth.user.id, stack.id);
    (this.autoStack as any).telemetryRepository.jobs.addToCounter('immich.auto_stack.candidates_promoted', 1);
    return { stackId: stack.id, primaryAssetId: primary };
  }

  @Delete('candidates/:candidateId')
  @Authenticated({ permission: Permission.StackDelete })
  discard(@Auth() _auth: AuthDto, @Param('candidateId', ParseUUIDPipe) _candidateId: string) {
    (this.autoStack as any).autoStackCandidateRepository.dismiss(_candidateId, _auth.user.id);
    (this.autoStack as any).telemetryRepository.jobs.addToCounter('immich.auto_stack.candidates_dismissed', 1);
    return { status: 'dismissed' };
  }

  @Post('candidates/:candidateId/rescore')
  @Authenticated({ permission: Permission.StackUpdate })
  async rescore(@Auth() auth: AuthDto, @Param('candidateId', ParseUUIDPipe) candidateId: string) {
    const { server } = await (this.autoStack as any).getConfig({ withCache: true });
    if (!server.autoStack.enabled) return { error: 'disabled' };
    const candidates = await this.autoStack.listCandidates(auth.user.id);
    const candidate = candidates.find((c: any) => c.id === candidateId);
    if (!candidate) return { error: 'not-found' };
    await (this.autoStack as any).jobRepository.queue({ name: 'AutoStackCandidateRescore', data: { id: candidateId } });
    return { status: 'queued' };
  }

  @Post('reset')
  @Authenticated({ permission: Permission.StackUpdate })
  async resetAll(@Auth() auth: AuthDto) {
    const { server } = await (this.autoStack as any).getConfig({ withCache: true });
    if (!server.autoStack.enabled) return { error: 'disabled' };
    // Queue a global reset (delete all candidates and reprocess window for each user)
    await (this.autoStack as any).jobRepository.queue({ name: 'AutoStackCandidateResetAll' });
    return { status: 'queued' };
  }

}
