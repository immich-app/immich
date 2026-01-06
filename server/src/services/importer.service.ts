import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  ImporterConfigResponseDto,
  ImporterPlatform,
  SetupTokenData,
  SetupTokenResponseDto,
} from 'src/dtos/importer.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';

// 30 days in milliseconds (to accommodate Takeout generation time)
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Placeholder strings in bootstrap binary (128 chars each for in-place replacement)
const SERVER_URL_PLACEHOLDER =
  '__IMMICH_SERVER_URL_PLACEHOLDER_________________________________________________________________________________________________';
const TOKEN_PLACEHOLDER =
  '__IMMICH_SETUP_TOKEN_PLACEHOLDER_________________________________________________________________________________________________';

@Injectable()
export class ImporterService extends BaseService {
  // In-memory storage for setup tokens (TODO: move to Redis for production)
  private readonly setupTokens = new Map<string, SetupTokenData>();

  // Cleanup expired tokens periodically
  private cleanupInterval?: NodeJS.Timeout;

  onModuleInit() {
    // Clean up expired tokens every hour
    this.cleanupInterval = setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  private cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, data] of this.setupTokens.entries()) {
      if (data.expiresAt < now) {
        this.setupTokens.delete(token);
        // Also try to delete the temporary API key
        this.apiKeyRepository.delete(data.userId, data.apiKeyId).catch(() => {
          // Ignore errors - key may already be deleted
        });
      }
    }
  }

  async createSetupToken(auth: AuthDto, requestBaseUrl?: string): Promise<SetupTokenResponseDto> {
    // 1. Create temporary API key with import permissions
    const apiKey = await this.createTemporaryApiKey(auth.user.id);

    // 2. Generate setup token
    const token = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS);

    // 3. Get server URL - prefer config, then request URL, then fallback
    const config = await this.getConfig({ withCache: true });
    const serverUrl = config.server.externalDomain || requestBaseUrl || this.getDefaultServerUrl();

    // 4. Store token data
    this.setupTokens.set(token, {
      userId: auth.user.id,
      apiKeyId: apiKey.id,
      apiKeySecret: apiKey.secret,
      serverUrl,
      createdAt: now,
      expiresAt,
    });

    this.logger.log(`Created setup token for user ${auth.user.id}, expires ${expiresAt.toISOString()}`);

    return { token, expiresAt };
  }

  async getImporterConfig(token: string): Promise<ImporterConfigResponseDto> {
    const data = this.setupTokens.get(token);

    if (!data) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (data.expiresAt < new Date()) {
      this.setupTokens.delete(token);
      throw new UnauthorizedException('Token has expired');
    }

    // Get OAuth config from system config
    const config = await this.getConfig({ withCache: true });
    const oauth = config.oauth;

    if (!oauth.clientId || !oauth.clientSecret) {
      throw new UnauthorizedException('OAuth is not configured on this server');
    }

    // Note: We don't delete the token here - it can be used multiple times
    // until it expires. This allows the app to re-fetch config if needed.

    return {
      serverUrl: data.serverUrl,
      apiKey: data.apiKeySecret,
      oauth: {
        clientId: oauth.clientId,
        clientSecret: oauth.clientSecret,
      },
    };
  }

  async buildBootstrap(token: string, platform: ImporterPlatform): Promise<Buffer> {
    const data = this.setupTokens.get(token);

    if (!data) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (data.expiresAt < new Date()) {
      this.setupTokens.delete(token);
      throw new UnauthorizedException('Token has expired');
    }

    // Read the pre-compiled bootstrap binary template
    const templatePath = this.getBootstrapTemplatePath(platform);
    let template: Buffer;

    try {
      template = await readFile(templatePath);
    } catch {
      this.logger.error(`Bootstrap template not found: ${templatePath}`);
      throw new UnauthorizedException(`Bootstrap not available for platform: ${platform}`);
    }

    // Patch the binary with actual values
    const patched = this.patchBootstrapBinary(template, data.serverUrl, token);

    this.logger.log(`Built bootstrap for platform ${platform}, token ${token.substring(0, 8)}...`);

    return patched;
  }

  private async createTemporaryApiKey(userId: string): Promise<{ id: string; secret: string }> {
    const token = this.cryptoRepository.randomBytesAsText(32);
    const tokenHashed = this.cryptoRepository.hashSha256(token);

    // Limited permissions for import only
    const permissions = [
      Permission.UserRead,
      Permission.AssetUpload,
      Permission.AssetRead,
      Permission.AlbumCreate,
      Permission.AlbumRead,
      Permission.AlbumUpdate,
      Permission.AlbumAssetCreate,
    ];

    const entity = await this.apiKeyRepository.create({
      key: tokenHashed,
      name: 'Google Photos Importer (temporary)',
      userId,
      permissions,
    });

    return { id: entity.id, secret: token };
  }

  private getDefaultServerUrl(): string {
    // Try to get from environment or use a default
    return process.env.IMMICH_SERVER_URL || 'http://localhost:2283';
  }

  private getBootstrapTemplatePath(platform: ImporterPlatform): string {
    // Bootstrap binaries are stored in assets/bootstrap/
    const filename = platform === ImporterPlatform.WINDOWS_AMD64
      ? `bootstrap-${platform}.exe`
      : `bootstrap-${platform}`;

    return join(process.cwd(), 'assets', 'bootstrap', filename);
  }

  private patchBootstrapBinary(template: Buffer, serverUrl: string, token: string): Buffer {
    // Convert to string for replacement (binary-safe)
    let content = template.toString('binary');

    // Pad values to match placeholder length (128 chars) with null bytes
    const paddedUrl = serverUrl.padEnd(128, '\0');
    const paddedToken = token.padEnd(128, '\0');

    // Replace placeholders
    content = content.replace(SERVER_URL_PLACEHOLDER, paddedUrl);
    content = content.replace(TOKEN_PLACEHOLDER, paddedToken);

    return Buffer.from(content, 'binary');
  }

  // Method to revoke a setup token and its API key
  async revokeSetupToken(token: string): Promise<void> {
    const data = this.setupTokens.get(token);

    if (data) {
      // Delete the temporary API key
      try {
        await this.apiKeyRepository.delete(data.userId, data.apiKeyId);
      } catch {
        // Ignore - key may already be deleted
      }

      this.setupTokens.delete(token);
      this.logger.log(`Revoked setup token ${token.substring(0, 8)}...`);
    }
  }
}
