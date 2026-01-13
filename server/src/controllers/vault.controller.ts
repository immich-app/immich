import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiTag, RouteKey } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AssetEncryptionService } from 'src/services/asset-encryption.service';
import { VaultService, VaultStatusResponseDto } from 'src/services/vault.service';

class VaultSetupDto {
  password!: string;
}

class VaultUnlockDto {
  password!: string;
}

class VaultChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
}

class VaultMigrationResponseDto {
  queuedCount!: number;
}

class AdminRecoveryKeyDto {
  publicKey!: string;
  keyId!: string;
}

class AdminRecoverVaultDto {
  userId!: string;
  adminPrivateKey!: string;
  newPassword!: string;
}

class AdminRecoveryKeyResponseDto {
  id!: string;
  keyId!: string;
  createdAt!: Date;
}

class AdminRecoveryStatusDto {
  hasRecoveryKey!: boolean;
}

@ApiTags(ApiTag.Vault)
@Controller(RouteKey.Vault)
export class VaultController {
  constructor(
    private vaultService: VaultService,
    private encryptionService: AssetEncryptionService,
  ) {}

  @Post('setup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  @Endpoint({
    summary: 'Set up vault',
    description: 'Create a new vault with the specified password. This enables encryption for your assets.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async setupVault(@Auth() auth: AuthDto, @Body() dto: VaultSetupDto): Promise<void> {
    await this.vaultService.setupVault(auth, dto);
  }

  @Post('unlock')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  @Endpoint({
    summary: 'Unlock vault',
    description: 'Unlock the vault with your password to access encrypted assets.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async unlockVault(@Auth() auth: AuthDto, @Body() dto: VaultUnlockDto): Promise<void> {
    await this.vaultService.unlockVault(auth, dto);
  }

  @Post('lock')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  @Endpoint({
    summary: 'Lock vault',
    description: 'Lock the vault, clearing the cached key from your session.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async lockVault(@Auth() auth: AuthDto): Promise<void> {
    await this.vaultService.lockVault(auth);
  }

  @Get('status')
  @Authenticated()
  @Endpoint({
    summary: 'Get vault status',
    description: 'Check if you have a vault set up and if it is currently unlocked.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async getVaultStatus(@Auth() auth: AuthDto): Promise<VaultStatusResponseDto> {
    return this.vaultService.getVaultStatus(auth);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  @Endpoint({
    summary: 'Change vault password',
    description: 'Change your vault password. This will re-encrypt the vault key.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async changePassword(@Auth() auth: AuthDto, @Body() dto: VaultChangePasswordDto): Promise<void> {
    await this.vaultService.changePassword(auth, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  @Endpoint({
    summary: 'Delete vault',
    description: 'Delete your vault. WARNING: This will make all encrypted assets inaccessible.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async deleteVault(@Auth() auth: AuthDto): Promise<void> {
    await this.vaultService.deleteVault(auth);
  }

  @Post('migrate')
  @Authenticated()
  @Endpoint({
    summary: 'Encrypt existing assets',
    description: 'Queue encryption for all your existing unencrypted assets. Vault must be unlocked.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async migrateAssets(@Auth() auth: AuthDto): Promise<VaultMigrationResponseDto> {
    return this.encryptionService.queueEncryptionMigration(auth);
  }

  // Admin recovery endpoints

  @Get('admin/recovery-status')
  @Authenticated({ admin: true })
  @Endpoint({
    summary: 'Check admin recovery status',
    description: 'Check if an admin recovery key has been registered.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async getAdminRecoveryStatus(@Auth() _auth: AuthDto): Promise<AdminRecoveryStatusDto> {
    const hasRecoveryKey = await this.vaultService.hasAdminRecoveryKey();
    return { hasRecoveryKey };
  }

  @Post('admin/recovery-key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ admin: true })
  @Endpoint({
    summary: 'Register admin recovery key',
    description: 'Register a public key for admin vault recovery. Keep the private key safe offline.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async registerAdminRecoveryKey(@Auth() auth: AuthDto, @Body() dto: AdminRecoveryKeyDto): Promise<void> {
    await this.vaultService.registerAdminRecoveryKey(auth, dto);
  }

  @Get('admin/recovery-keys')
  @Authenticated({ admin: true })
  @Endpoint({
    summary: 'List admin recovery keys',
    description: 'List all registered admin recovery keys.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async getAdminRecoveryKeys(@Auth() auth: AuthDto): Promise<AdminRecoveryKeyResponseDto[]> {
    return this.vaultService.getAdminRecoveryKeys(auth);
  }

  @Delete('admin/recovery-key/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ admin: true })
  @Endpoint({
    summary: 'Delete admin recovery key',
    description: 'Delete an admin recovery key. This will prevent recovery for vaults that used this key.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async deleteAdminRecoveryKey(@Auth() auth: AuthDto, @Param('id') id: string): Promise<void> {
    await this.vaultService.deleteAdminRecoveryKey(auth, id);
  }

  @Post('admin/recover')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ admin: true })
  @Endpoint({
    summary: 'Recover user vault',
    description: 'Recover a user vault using the admin private key. Sets a new vault password for the user.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async adminRecoverVault(@Auth() auth: AuthDto, @Body() dto: AdminRecoverVaultDto): Promise<void> {
    await this.vaultService.adminRecoverVault(auth, dto);
  }
}
