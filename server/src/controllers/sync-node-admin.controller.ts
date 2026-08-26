import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  SyncNodeCreateDto,
  SyncNodeRemoteUserDto,
  SyncNodeResponseDto,
  SyncNodeTestResponseDto,
  SyncNodeUpdateDto,
  SyncPairingCreateDto,
  SyncPairingItemSearchDto,
  SyncPairingItemsResponseDto,
  SyncPairingResponseDto,
  SyncPairingRetryDto,
  SyncPairingRetryResponseDto,
  SyncPairingUpdateDto,
} from 'src/dtos/sync-node.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { SyncNodeService } from 'src/services/sync-node.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.SyncNodes)
@Controller('admin/sync-nodes')
export class SyncNodeAdminController {
  constructor(private service: SyncNodeService) {}

  @Get()
  @Authenticated({ permission: Permission.AdminSyncNodeRead, admin: true })
  @Endpoint({
    summary: 'Retrieve sync nodes',
    description: 'Retrieve every paired Immich instance. API keys are never included.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  getSyncNodes(): Promise<SyncNodeResponseDto[]> {
    return this.service.getAll();
  }

  @Post()
  @Authenticated({ permission: Permission.AdminSyncNodeCreate, admin: true })
  @Endpoint({
    summary: 'Add a sync node',
    description: 'Pair another Immich instance. The connection is verified before it is stored.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  createSyncNode(@Body() dto: SyncNodeCreateDto): Promise<SyncNodeResponseDto> {
    return this.service.create(dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.AdminSyncNodeRead, admin: true })
  @Endpoint({
    summary: 'Retrieve a sync node',
    description: 'Retrieve a specific sync node. The API key is never included.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  getSyncNode(@Param() { id }: UUIDParamDto): Promise<SyncNodeResponseDto> {
    return this.service.get(id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.AdminSyncNodeUpdate, admin: true })
  @Endpoint({
    summary: 'Update a sync node',
    description: 'Update a sync node. Omitting the API key keeps the stored one.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  updateSyncNode(@Param() { id }: UUIDParamDto, @Body() dto: SyncNodeUpdateDto): Promise<SyncNodeResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.AdminSyncNodeDelete, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Remove a sync node',
    description: 'Unpair an instance. Assets on both sides are left exactly as they are.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  deleteSyncNode(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(id);
  }

  @Post(':id/test')
  @Authenticated({ permission: Permission.AdminSyncNodeUpdate, admin: true })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Test a sync node',
    description: 'Check that the peer is reachable, compatible, and that its API key has the needed permissions.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  testSyncNode(@Param() { id }: UUIDParamDto): Promise<SyncNodeTestResponseDto> {
    return this.service.test(id);
  }

  @Get(':id/users')
  @Authenticated({ permission: Permission.AdminSyncNodeRead, admin: true })
  @Endpoint({
    summary: 'Retrieve users on a sync node',
    description: 'List the users on the peer, so a local user can be paired with one of them.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  getSyncNodeUsers(@Param() { id }: UUIDParamDto): Promise<SyncNodeRemoteUserDto[]> {
    return this.service.getRemoteUsers(id);
  }

  @Get(':id/pairings')
  @Authenticated({ permission: Permission.AdminSyncNodeRead, admin: true })
  @Endpoint({
    summary: 'Retrieve pairings',
    description: 'List the user pairings configured for a sync node.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  getSyncPairings(@Param() { id }: UUIDParamDto): Promise<SyncPairingResponseDto[]> {
    return this.service.getPairings(id);
  }

  @Post(':id/pairings')
  @Authenticated({ permission: Permission.AdminSyncNodeUpdate, admin: true })
  @Endpoint({
    summary: 'Pair a user',
    description: 'Pair a local user with a user on the peer, and choose which directions sync.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  createSyncPairing(@Param() { id }: UUIDParamDto, @Body() dto: SyncPairingCreateDto): Promise<SyncPairingResponseDto> {
    return this.service.createPairing(id, dto);
  }

  @Get('pairings/:id')
  @Authenticated({ permission: Permission.AdminSyncNodeRead, admin: true })
  @Endpoint({
    summary: 'Retrieve a pairing',
    description: 'Retrieve one user pairing, including how much of its work is outstanding.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  getSyncPairing(@Param() { id }: UUIDParamDto): Promise<SyncPairingResponseDto> {
    return this.service.getPairing(id);
  }

  @Get('pairings/:id/items')
  @Authenticated({ permission: Permission.AdminSyncNodeRead, admin: true })
  @Endpoint({
    summary: 'Retrieve the outstanding items for a pairing',
    description:
      'List the assets a pairing still has to transfer, with the attempt count and last failure for each, so a stalled sync can be looked at item by item.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  getSyncPairingItems(
    @Param() { id }: UUIDParamDto,
    @Query() dto: SyncPairingItemSearchDto,
  ): Promise<SyncPairingItemsResponseDto> {
    return this.service.getPairingItems(id, dto);
  }

  @Post('pairings/:id/retry')
  @Authenticated({ permission: Permission.AdminSyncNodeUpdate, admin: true })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Retry the items that need attention',
    description:
      'Put items that have run out of attempts back in the queue and start them, for once whatever was blocking them has been dealt with. Omit the item list to retry all of them.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  retrySyncPairingItems(
    @Param() { id }: UUIDParamDto,
    @Body() dto: SyncPairingRetryDto,
  ): Promise<SyncPairingRetryResponseDto> {
    return this.service.retryPairingItems(id, dto);
  }

  @Put('pairings/:id')
  @Authenticated({ permission: Permission.AdminSyncNodeUpdate, admin: true })
  @Endpoint({
    summary: 'Update a pairing',
    description: 'Turn push or pull on or off for a pairing.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  updateSyncPairing(@Param() { id }: UUIDParamDto, @Body() dto: SyncPairingUpdateDto): Promise<SyncPairingResponseDto> {
    return this.service.updatePairing(id, dto);
  }

  @Delete('pairings/:id')
  @Authenticated({ permission: Permission.AdminSyncNodeDelete, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Remove a pairing',
    description: 'Stop syncing a user pair. Assets on both sides are left exactly as they are.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  deleteSyncPairing(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.removePairing(id);
  }

  @Post('pairings/:id/sync')
  @Authenticated({ permission: Permission.AdminSyncNodeUpdate, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Sync a pairing now',
    description: 'Queue an immediate sync for one pairing instead of waiting for the schedule.',
    history: new HistoryBuilder().added('v3').beta('v3'),
  })
  syncPairingNow(@Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.syncPairingNow(id);
  }
}
