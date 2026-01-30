import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import Redis from 'ioredis';
import { createHash, scrypt, ScryptOptions } from 'node:crypto';
import { AuthDto } from 'src/dtos/auth.dto';
import type { VaultStatusResponseDto } from 'src/dtos/vault.dto';
import { BaseService } from 'src/services/base.service';

export type { VaultStatusResponseDto } from 'src/dtos/vault.dto';

function scryptAsync(secret: string | Buffer, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(secret, salt, keylen, options, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

export interface VaultSetupDto {
  pin: string;
}

export interface VaultUnlockDto {
  pin: string;
}

export interface VaultChangePinDto {
  currentPin: string;
  newPin: string;
}

export interface AdminRecoverVaultDto {
  userId: string;
  adminPrivateKey: string;
  newPin: string;
}

export interface AdminRecoveryKeyDto {
  publicKey: string;
  keyId: string;
}

// 4 hours default expiry for vault key cache
const VAULT_KEY_CACHE_EXPIRY_MS = 4 * 60 * 60 * 1000;

// KDF parameters for scrypt (secure defaults)
const KDF_PARAMS = {
  algorithm: 'scrypt',
  N: 2 ** 17, // CPU/memory cost (128 MiB with r=8)
  r: 8, // Block size
  p: 1, // Parallelization
  keyLen: 32, // Output key length (256 bits)
  maxmem: 256 * 1024 * 1024, // 256 MiB - override OpenSSL's default limit
};

// Rate limiting constants for vault PIN brute force protection
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
const LOCKOUT_DURATIONS_MS = [
  1 * 60 * 1000, // 1 minute
  5 * 60 * 1000, // 5 minutes
  15 * 60 * 1000, // 15 minutes
  60 * 60 * 1000, // 1 hour
  4 * 60 * 60 * 1000, // 4 hours (max)
];
const ATTEMPT_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const VAULT_ATTEMPT_KEY_PREFIX = 'vault:attempts:';

interface VaultAttemptInfo {
  count: number;
  lockUntil?: number; // timestamp ms
}

@Injectable()
export class VaultService extends BaseService {
  private redis?: Redis;

  private async getRedis(): Promise<Redis> {
    if (!this.redis) {
      const { redis } = this.configRepository.getEnv();
      this.redis = new Redis({ ...redis, lazyConnect: true });
      await this.redis.connect();
    }
    return this.redis;
  }

  private async checkLockout(userId: string): Promise<void> {
    const redis = await this.getRedis();
    const data = await redis.get(`${VAULT_ATTEMPT_KEY_PREFIX}${userId}`);
    if (!data) {
      return;
    }

    const attempts: VaultAttemptInfo = JSON.parse(data);
    if (attempts.lockUntil && attempts.lockUntil > Date.now()) {
      const remainingMs = attempts.lockUntil - Date.now();
      const minutes = Math.floor(remainingMs / 60_000);
      const seconds = Math.ceil((remainingMs % 60_000) / 1000);
      const timeMsg = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      throw new UnauthorizedException(`Vault temporarily locked. Try again in ${timeMsg}.`);
    }
  }

  private async recordFailedAttempt(userId: string): Promise<void> {
    const redis = await this.getRedis();
    const key = `${VAULT_ATTEMPT_KEY_PREFIX}${userId}`;
    const data = await redis.get(key);

    const attempts: VaultAttemptInfo = data ? JSON.parse(data) : { count: 0 };
    attempts.count++;

    if (attempts.count >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
      const lockoutIndex = Math.min(attempts.count - MAX_ATTEMPTS_BEFORE_LOCKOUT, LOCKOUT_DURATIONS_MS.length - 1);
      attempts.lockUntil = Date.now() + LOCKOUT_DURATIONS_MS[lockoutIndex];
      this.logger.warn(`Vault locked for user ${userId} after ${attempts.count} failed attempts`);
    }

    await redis.set(key, JSON.stringify(attempts), 'EX', ATTEMPT_TTL_SECONDS);
  }

  private async resetAttempts(userId: string): Promise<void> {
    const redis = await this.getRedis();
    await redis.del(`${VAULT_ATTEMPT_KEY_PREFIX}${userId}`);
  }

  /**
   * Set up a new vault for the user with the given PIN.
   * Creates a new vault key (KEK) and encrypts it with the PIN-derived key.
   */
  async setupVault(auth: AuthDto, dto: VaultSetupDto): Promise<void> {
    const userId = auth.user.id;

    // Check if vault already exists
    const existingVault = await this.vaultRepository.exists(userId);
    if (existingVault) {
      throw new BadRequestException('Vault already exists for this user');
    }

    // Generate vault key (KEK - Key Encryption Key)
    const vaultKey = this.cryptoRepository.generateEncryptionKey();

    // Generate salt and derive PIN key
    const salt = this.cryptoRepository.randomBytes(32);
    const pinKey = await this.deriveKey(dto.pin, salt);

    // Encrypt vault key with PIN-derived key
    const encryptedVaultKey = this.cryptoRepository.wrapKey(vaultKey, pinKey);

    // Hash vault key for verification
    const vaultKeyHash = createHash('sha256').update(vaultKey).digest('base64');

    // Get admin recovery key if available and encrypt vault key for recovery
    let adminEncryptedVaultKey: string | null = null;
    const adminRecoveryKey = await this.adminRecoveryKeyRepository.getFirst();
    if (adminRecoveryKey) {
      try {
        const encryptedForAdmin = this.cryptoRepository.encryptRsa(vaultKey, adminRecoveryKey.publicKey);
        adminEncryptedVaultKey = encryptedForAdmin.toString('base64');
      } catch (error) {
        this.logger.warn(`Failed to encrypt vault key with admin recovery key: ${error}`);
        // Continue without admin recovery - not a fatal error
      }
    }

    // Store vault
    await this.vaultRepository.create({
      id: this.cryptoRepository.randomUUID(),
      userId,
      kdfSalt: salt.toString('base64'),
      kdfParams: {
        algorithm: KDF_PARAMS.algorithm,
        memoryMiB: Math.round((KDF_PARAMS.N * KDF_PARAMS.r * 128) / (1024 * 1024)),
        iterations: 1, // scrypt uses N instead of iterations
        parallelism: KDF_PARAMS.p,
      },
      encryptedVaultKey,
      adminEncryptedVaultKey,
      vaultKeyHash,
      version: 1,
    });

    this.logger.log(`Vault created for user ${userId}`);

    // Automatically unlock after setup (only if session exists)
    if (auth.session) {
      await this.cacheVaultKey(auth, vaultKey);
    }
  }

  /**
   * Unlock the vault for the current session using the vault PIN.
   * The vault key is cached in the session for subsequent decryption operations.
   */
  async unlockVault(auth: AuthDto, dto: VaultUnlockDto): Promise<void> {
    const userId = auth.user.id;

    await this.checkLockout(userId);

    if (!auth.session) {
      throw new BadRequestException('Session required to unlock vault');
    }

    // Get vault
    const vault = await this.vaultRepository.getByUserId(userId);
    if (!vault) {
      throw new NotFoundException('Vault not found');
    }

    // Derive key from PIN
    const salt = Buffer.from(vault.kdfSalt, 'base64');
    const pinKey = await this.deriveKey(dto.pin, salt);

    // Decrypt vault key
    let vaultKey: Buffer;
    try {
      vaultKey = this.cryptoRepository.unwrapKey(vault.encryptedVaultKey, pinKey);
    } catch {
      await this.recordFailedAttempt(userId);
      throw new UnauthorizedException('Invalid vault PIN');
    }

    // Verify vault key
    const keyHash = createHash('sha256').update(vaultKey).digest('base64');
    if (keyHash !== vault.vaultKeyHash) {
      await this.recordFailedAttempt(userId);
      throw new UnauthorizedException('Invalid vault PIN');
    }

    await this.resetAttempts(userId);

    // Cache vault key in session
    await this.cacheVaultKey(auth, vaultKey);

    this.logger.log(`Vault unlocked for user ${userId}`);
  }

  /**
   * Lock the vault by clearing the cached vault key from the session.
   */
  async lockVault(auth: AuthDto): Promise<void> {
    if (!auth.session) {
      throw new BadRequestException('Session required to lock vault');
    }

    await this.sessionRepository.update(auth.session.id, {
      encryptedVaultKeyCache: null,
      vaultKeyExpiresAt: null,
    });

    this.logger.log(`Vault locked for user ${auth.user.id}`);
  }

  /**
   * Get the vault status for the current user.
   */
  async getVaultStatus(auth: AuthDto): Promise<VaultStatusResponseDto> {
    const vault = await this.vaultRepository.getByUserId(auth.user.id);

    let isUnlocked = false;
    if (auth.session && vault) {
      try {
        const sessionRecord = await this.getSessionWithVaultCache(auth.session.id);
        if (sessionRecord?.encryptedVaultKeyCache && sessionRecord.vaultKeyExpiresAt) {
          isUnlocked = new Date(sessionRecord.vaultKeyExpiresAt) > new Date();
        }
      } catch (error) {
        this.logger.warn(`Failed to check vault unlock status: ${error}`);
      }
    }

    return {
      hasVault: !!vault,
      isUnlocked,
      vaultVersion: vault?.version ?? null,
    };
  }

  /**
   * Change the vault PIN.
   */
  async changePin(auth: AuthDto, dto: VaultChangePinDto): Promise<void> {
    const userId = auth.user.id;

    await this.checkLockout(userId);

    // Get vault
    const vault = await this.vaultRepository.getByUserId(userId);
    if (!vault) {
      throw new NotFoundException('Vault not found');
    }

    // Verify current PIN by deriving key and decrypting vault key
    const currentSalt = Buffer.from(vault.kdfSalt, 'base64');
    const currentPinKey = await this.deriveKey(dto.currentPin, currentSalt);

    let vaultKey: Buffer;
    try {
      vaultKey = this.cryptoRepository.unwrapKey(vault.encryptedVaultKey, currentPinKey);
    } catch {
      await this.recordFailedAttempt(userId);
      throw new UnauthorizedException('Invalid current vault PIN');
    }

    // Verify vault key hash
    const keyHash = createHash('sha256').update(vaultKey).digest('base64');
    if (keyHash !== vault.vaultKeyHash) {
      await this.recordFailedAttempt(userId);
      throw new UnauthorizedException('Invalid current vault PIN');
    }

    await this.resetAttempts(userId);

    // Generate new salt and derive new PIN key
    const newSalt = this.cryptoRepository.randomBytes(32);
    const newPinKey = await this.deriveKey(dto.newPin, newSalt);

    // Re-encrypt vault key with new PIN-derived key
    const newEncryptedVaultKey = this.cryptoRepository.wrapKey(vaultKey, newPinKey);

    // Update vault
    await this.vaultRepository.update(userId, {
      kdfSalt: newSalt.toString('base64'),
      encryptedVaultKey: newEncryptedVaultKey,
    });

    // Clear cached vault key from all sessions for this user
    // User will need to re-unlock
    const sessions = await this.sessionRepository.getByUserId(userId);
    for (const session of sessions) {
      await this.sessionRepository.update(session.id, {
        encryptedVaultKeyCache: null,
        vaultKeyExpiresAt: null,
      });
    }

    this.logger.log(`Vault PIN changed for user ${userId}`);
  }

  /**
   * Get the vault key for decryption operations.
   * Returns null if vault is locked or doesn't exist.
   */
  async getVaultKey(auth: AuthDto): Promise<Buffer | null> {
    if (!auth.session) {
      return null;
    }

    const sessionRecord = await this.getSessionWithVaultCache(auth.session.id);
    if (!sessionRecord?.encryptedVaultKeyCache || !sessionRecord.vaultKeyExpiresAt) {
      return null;
    }

    // Check if expired
    if (new Date(sessionRecord.vaultKeyExpiresAt) <= new Date()) {
      // Clear expired cache
      await this.sessionRepository.update(auth.session.id, {
        encryptedVaultKeyCache: null,
        vaultKeyExpiresAt: null,
      });
      return null;
    }

    // Decrypt vault key from cache using session token as key
    // The session token is hashed (stored in DB) but we use the session ID
    // as a simple encryption key for the cached vault key
    try {
      const sessionKey = await this.deriveSessionKey(auth.session.id);
      return this.cryptoRepository.unwrapKey(sessionRecord.encryptedVaultKeyCache, sessionKey);
    } catch {
      this.logger.warn(`Failed to decrypt vault key from session cache`);
      return null;
    }
  }

  /**
   * Delete the vault for a user. This is destructive - all encrypted assets
   * will become inaccessible.
   */
  async deleteVault(auth: AuthDto): Promise<void> {
    const userId = auth.user.id;

    const vault = await this.vaultRepository.getByUserId(userId);
    if (!vault) {
      throw new NotFoundException('Vault not found');
    }

    // TODO: Consider adding a check for encrypted assets and warning
    await this.vaultRepository.delete(userId);

    this.logger.log(`Vault deleted for user ${userId}`);
  }

  /**
   * Admin: Register a recovery public key.
   * Only one recovery key is supported at a time.
   */
  async registerAdminRecoveryKey(auth: AuthDto, dto: AdminRecoveryKeyDto): Promise<void> {
    // Verify caller is admin
    if (!auth.user.isAdmin) {
      throw new UnauthorizedException('Only admins can register recovery keys');
    }

    // Check if key already exists
    const existingKey = await this.adminRecoveryKeyRepository.getByKeyId(dto.keyId);
    if (existingKey) {
      throw new BadRequestException('Recovery key with this ID already exists');
    }

    // Validate the public key format (basic check)
    if (!dto.publicKey.includes('-----BEGIN') || !dto.publicKey.includes('PUBLIC KEY-----')) {
      throw new BadRequestException('Invalid public key format. Expected PEM format.');
    }

    await this.adminRecoveryKeyRepository.create({
      id: this.cryptoRepository.randomUUID(),
      publicKey: dto.publicKey,
      keyId: dto.keyId,
    });

    this.logger.log(`Admin recovery key registered with ID: ${dto.keyId}`);
  }

  /**
   * Admin: List all registered recovery keys.
   */
  async getAdminRecoveryKeys(auth: AuthDto): Promise<{ id: string; keyId: string; createdAt: Date }[]> {
    if (!auth.user.isAdmin) {
      throw new UnauthorizedException('Only admins can view recovery keys');
    }

    const keys = await this.adminRecoveryKeyRepository.getAll();
    return keys.map((k) => ({
      id: k.id,
      keyId: k.keyId,
      createdAt: k.createdAt,
    }));
  }

  /**
   * Admin: Delete a recovery key.
   */
  async deleteAdminRecoveryKey(auth: AuthDto, id: string): Promise<void> {
    if (!auth.user.isAdmin) {
      throw new UnauthorizedException('Only admins can delete recovery keys');
    }

    const key = await this.adminRecoveryKeyRepository.get(id);
    if (!key) {
      throw new NotFoundException('Recovery key not found');
    }

    await this.adminRecoveryKeyRepository.delete(id);
    this.logger.log(`Admin recovery key deleted: ${key.keyId}`);
  }

  /**
   * Admin: Recover a user's vault using the admin private key.
   * This allows setting a new vault PIN for the user.
   */
  async adminRecoverVault(auth: AuthDto, dto: AdminRecoverVaultDto): Promise<void> {
    // Verify caller is admin
    if (!auth.user.isAdmin) {
      throw new UnauthorizedException('Only admins can recover vaults');
    }

    // Get the user's vault
    const vault = await this.vaultRepository.getByUserId(dto.userId);
    if (!vault) {
      throw new NotFoundException('Vault not found for this user');
    }

    if (!vault.adminEncryptedVaultKey) {
      throw new BadRequestException('Vault was not set up with admin recovery');
    }

    // Decrypt the vault key using admin private key
    let vaultKey: Buffer;
    try {
      const encryptedVaultKeyBuffer = Buffer.from(vault.adminEncryptedVaultKey, 'base64');
      vaultKey = this.cryptoRepository.decryptRsa(encryptedVaultKeyBuffer, dto.adminPrivateKey);
    } catch {
      throw new UnauthorizedException('Failed to decrypt vault key - invalid admin private key');
    }

    // Verify vault key
    const keyHash = createHash('sha256').update(vaultKey).digest('base64');
    if (keyHash !== vault.vaultKeyHash) {
      throw new UnauthorizedException('Vault key verification failed');
    }

    // Generate new salt and derive new PIN key
    const newSalt = this.cryptoRepository.randomBytes(32);
    const newPinKey = await this.deriveKey(dto.newPin, newSalt);

    // Re-encrypt vault key with new PIN
    const newEncryptedVaultKey = this.cryptoRepository.wrapKey(vaultKey, newPinKey);

    // Update vault
    await this.vaultRepository.update(dto.userId, {
      kdfSalt: newSalt.toString('base64'),
      encryptedVaultKey: newEncryptedVaultKey,
    });

    // Clear cached vault key from all sessions for this user
    const sessions = await this.sessionRepository.getByUserId(dto.userId);
    for (const session of sessions) {
      await this.sessionRepository.update(session.id, {
        encryptedVaultKeyCache: null,
        vaultKeyExpiresAt: null,
      });
    }

    this.logger.log(`Admin recovered vault for user ${dto.userId}`);
  }

  /**
   * Check if admin recovery is available (a recovery key is registered).
   */
  async hasAdminRecoveryKey(): Promise<boolean> {
    return this.adminRecoveryKeyRepository.exists();
  }

  /**
   * Derive a key from PIN using scrypt.
   */
  private async deriveKey(pin: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(pin, salt, KDF_PARAMS.keyLen, {
      N: KDF_PARAMS.N,
      r: KDF_PARAMS.r,
      p: KDF_PARAMS.p,
      maxmem: KDF_PARAMS.maxmem,
    })) as Buffer;
  }

  /**
   * Cache the vault key in the session.
   * The vault key is encrypted with a session-derived key before storage.
   */
  private async cacheVaultKey(auth: AuthDto, vaultKey: Buffer): Promise<void> {
    if (!auth.session) {
      throw new BadRequestException('Session required to cache vault key');
    }

    // Derive a key from the session ID to encrypt the vault key
    const sessionKey = await this.deriveSessionKey(auth.session.id);

    // Encrypt vault key for storage in session
    const encryptedVaultKey = this.cryptoRepository.wrapKey(vaultKey, sessionKey);

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + VAULT_KEY_CACHE_EXPIRY_MS);

    await this.sessionRepository.update(auth.session.id, {
      encryptedVaultKeyCache: encryptedVaultKey,
      vaultKeyExpiresAt: expiresAt,
    });
  }

  /**
   * Derive a session key from the session ID.
   * This is used to encrypt the vault key in the session cache.
   */
  private async deriveSessionKey(sessionId: string): Promise<Buffer> {
    // Use a deterministic derivation from session ID
    // In production, you might want to use a separate secret
    const salt = Buffer.from('immich-vault-session-key', 'utf8');
    return scryptAsync(sessionId, salt, 32, {
      N: 2 ** 14, // Lower cost for session key derivation
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024, // 64 MiB
    });
  }

  /**
   * Get session record with vault key cache fields.
   */
  private async getSessionWithVaultCache(sessionId: string) {
    return this.sessionRepository.getWithVaultCache(sessionId);
  }
}
