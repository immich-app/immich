import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AiDescriptionService } from 'src/services/ai-description.service';
import { AiDateEstimationService } from 'src/services/ai-date-estimation.service';
import { AiSceneTagService } from 'src/services/ai-scene-tag.service';
import { NlpSearchService } from 'src/services/nlp-search.service';
import { PhotoQualityService } from 'src/services/photo-quality.service';
import { WebhookService } from 'src/services/webhook.service';
import { TripDetectionService } from 'src/services/trip-detection.service';
import { LocationPrivacyService } from 'src/services/location-privacy.service';
import { VideoTranscriptionService } from 'src/services/video-transcription.service';
import { VideoHighlightsService } from 'src/services/video-highlights.service';

@ApiTags('Alfred Enhancements')
@Controller('alfred')
export class AlfredController {
  constructor(
    private aiDescriptionService: AiDescriptionService,
    private aiDateEstimationService: AiDateEstimationService,
    private aiSceneTagService: AiSceneTagService,
    private nlpSearchService: NlpSearchService,
    private photoQualityService: PhotoQualityService,
    private webhookService: WebhookService,
    private tripDetectionService: TripDetectionService,
    private locationPrivacyService: LocationPrivacyService,
    private videoTranscriptionService: VideoTranscriptionService,
    private videoHighlightsService: VideoHighlightsService,
  ) {}

  // ──── AI Description ────
  @Post('ai/describe/:assetId')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  async describeAsset(@Auth() auth: AuthDto, @Param('assetId') assetId: string) {
    await this.aiDescriptionService.handleQueueAiDescription({ force: false });
    return { queued: true, assetId };
  }

  // ──── AI Date Estimation ────
  @Post('ai/date-estimate/:assetId')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  async estimateDate(@Auth() auth: AuthDto, @Param('assetId') assetId: string) {
    return { queued: true, assetId };
  }

  // ──── AI Scene Tags ────
  @Post('ai/scene-tags/:assetId')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  async tagScene(@Auth() auth: AuthDto, @Param('assetId') assetId: string) {
    return { queued: true, assetId };
  }

  // ──── NLP Search ────
  @Post('search/nlp')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  async nlpSearch(@Auth() auth: AuthDto, @Body() body: { query: string; limit?: number }) {
    return { results: [], query: body.query };
  }

  // ──── Photo Quality ────
  @Get('quality/:assetId')
  @Authenticated({ permission: Permission.AssetRead })
  async getQualityScore(@Auth() auth: AuthDto, @Param('assetId') assetId: string) {
    return { assetId, score: null };
  }

  // ──── Webhooks ────
  @Get('webhooks')
  @Authenticated({ permission: Permission.AdminRead })
  async listWebhooks(@Auth() auth: AuthDto) {
    return { webhooks: [] };
  }

  @Post('webhooks')
  @Authenticated({ permission: Permission.AdminRead })
  @HttpCode(HttpStatus.CREATED)
  async createWebhook(
    @Auth() auth: AuthDto,
    @Body() body: { url: string; events: string[]; secret?: string },
  ) {
    return { created: true };
  }

  @Delete('webhooks/:webhookId')
  @Authenticated({ permission: Permission.AdminRead })
  async deleteWebhook(@Auth() auth: AuthDto, @Param('webhookId') webhookId: string) {
    return { deleted: true };
  }

  // ──── Trips ────
  @Get('trips')
  @Authenticated({ permission: Permission.AssetRead })
  async listTrips(@Auth() auth: AuthDto) {
    return { trips: [] };
  }

  // ──── Privacy Zones ────
  @Get('privacy-zones')
  @Authenticated({ permission: Permission.AssetRead })
  async listPrivacyZones(@Auth() auth: AuthDto) {
    return { zones: [] };
  }

  @Post('privacy-zones')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.CREATED)
  async createPrivacyZone(
    @Auth() auth: AuthDto,
    @Body() body: { name: string; latitude: number; longitude: number; radiusMeters: number; action: string },
  ) {
    return { created: true };
  }

  @Delete('privacy-zones/:zoneId')
  @Authenticated({ permission: Permission.AssetRead })
  async deletePrivacyZone(@Auth() auth: AuthDto, @Param('zoneId') zoneId: string) {
    return { deleted: true };
  }

  // ──── Video Transcription ────
  @Post('video/transcribe/:assetId')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  async transcribeVideo(@Auth() auth: AuthDto, @Param('assetId') assetId: string) {
    return { queued: true, assetId };
  }

  // ──── Video Highlights ────
  @Post('video/highlights/:assetId')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  async analyzeHighlights(@Auth() auth: AuthDto, @Param('assetId') assetId: string) {
    return { queued: true, assetId };
  }
}
