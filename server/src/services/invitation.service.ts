import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { SALT_ROUNDS } from 'src/constants';
import {
  AcceptInvitationDto,
  CreateInvitationDto,
  InvitationResponseDto,
  mapInvitation,
} from 'src/dtos/invitation.dto';
import { UserAdminResponseDto, mapUserAdmin } from 'src/dtos/user.dto';
import { AlbumUserRole } from 'src/enum';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { EmailRepository } from 'src/repositories/email.repository';
import { InvitationRepository } from 'src/repositories/invitation.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { UserRepository } from 'src/repositories/user.repository';

const INVITATION_EXPIRY_DAYS = 7;

@Injectable()
export class InvitationService {
  constructor(
    private logger: LoggingRepository,
    private albumRepository: AlbumRepository,
    private albumUserRepository: AlbumUserRepository,
    private configRepository: ConfigRepository,
    private cryptoRepository: CryptoRepository,
    private emailRepository: EmailRepository,
    private invitationRepository: InvitationRepository,
    private userRepository: UserRepository,
  ) {
    this.logger.setContext(InvitationService.name);
  }

  async create(adminId: string, dto: CreateInvitationDto): Promise<InvitationResponseDto> {
    const { familyMode } = this.configRepository.getEnv();
    if (!familyMode) {
      throw new BadRequestException('Invitations are only available in family mode');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.getByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    // Check if invitation already exists and is pending
    const existingInvitation = await this.invitationRepository.getByEmail(dto.email);
    if (existingInvitation) {
      throw new BadRequestException('An invitation has already been sent to this email');
    }

    // Generate a secure token
    const token = this.cryptoRepository.randomBytes(32).toString('hex');

    const invitation = await this.invitationRepository.create({
      email: dto.email,
      token,
      invitedById: adminId,
      expiresAt: DateTime.now().plus({ days: INVITATION_EXPIRY_DAYS }).toJSDate(),
    });

    this.logger.log(`Invitation created for ${dto.email} by admin ${adminId}`);

    // TODO: Send email with invitation link
    // await this.emailRepository.sendInvitation(dto.email, token);

    return mapInvitation(invitation);
  }

  async list(adminId: string): Promise<InvitationResponseDto[]> {
    const { familyMode } = this.configRepository.getEnv();
    if (!familyMode) {
      throw new BadRequestException('Invitations are only available in family mode');
    }

    const invitations = await this.invitationRepository.getPendingByInviter(adminId);
    return invitations.map(mapInvitation);
  }

  async revoke(adminId: string, invitationId: string): Promise<void> {
    const { familyMode } = this.configRepository.getEnv();
    if (!familyMode) {
      throw new BadRequestException('Invitations are only available in family mode');
    }

    const invitation = await this.invitationRepository.getById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.invitedById !== adminId) {
      throw new ForbiddenException('You can only revoke your own invitations');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    await this.invitationRepository.delete(invitationId);
    this.logger.log(`Invitation ${invitationId} revoked by admin ${adminId}`);
  }

  async accept(dto: AcceptInvitationDto): Promise<UserAdminResponseDto> {
    const { familyMode } = this.configRepository.getEnv();
    if (!familyMode) {
      throw new BadRequestException('Invitations are only available in family mode');
    }

    const invitation = await this.invitationRepository.getByToken(dto.token);
    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    // Check if user already exists (in case of race condition)
    const existingUser = await this.userRepository.getByEmail(invitation.email);
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    // Create the user
    const hashedPassword = await this.cryptoRepository.hashBcrypt(dto.password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      email: invitation.email,
      name: dto.name,
      password: hashedPassword,
      isAdmin: false,
      shouldChangePassword: false,
    });

    // Mark invitation as accepted
    await this.invitationRepository.update(invitation.id as string, {
      acceptedAt: DateTime.now().toJSDate(),
    });

    // Auto-add the new user as a viewer to all albums owned by the inviter
    const albums = await this.albumRepository.getOwned(invitation.invitedById);
    for (const album of albums) {
      try {
        await this.albumUserRepository.create({
          albumId: album.id,
          userId: user.id,
          role: AlbumUserRole.Viewer,
        });
        this.logger.log(`Added user ${user.id} as viewer to album ${album.id}`);
      } catch (error) {
        // Skip if already added (shouldn't happen but handle gracefully)
        this.logger.warn(`Failed to add user ${user.id} to album ${album.id}: ${error}`);
      }
    }

    this.logger.log(`Invitation accepted by ${invitation.email}, user ${user.id} created and added to ${albums.length} albums`);

    return mapUserAdmin(user);
  }

  async getByToken(token: string): Promise<InvitationResponseDto | null> {
    const invitation = await this.invitationRepository.getByToken(token);
    return invitation ? mapInvitation(invitation) : null;
  }
}
