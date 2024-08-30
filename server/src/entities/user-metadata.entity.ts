import { UserEntity } from 'src/entities/user.entity';
import { UserAvatarColor, UserMetadataKey } from 'src/enum';
import { HumanReadableSize } from 'src/utils/bytes';
import { Column, DeepPartial, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('user_metadata')
export class UserMetadataEntity<T extends keyof UserMetadata = UserMetadataKey> {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.metadata, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: UserEntity;

  @PrimaryColumn({ type: 'varchar' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: UserMetadata[T];
}

export interface UserPreferences {
  folders: {
    enabled: boolean;
    sidebarWeb: boolean;
  };
  memories: {
    enabled: boolean;
  };
  people: {
    enabled: boolean;
    sidebarWeb: boolean;
  };
  ratings: {
    enabled: boolean;
  };
  tags: {
    enabled: boolean;
    sidebarWeb: boolean;
  };
  avatar: {
    color: UserAvatarColor;
  };
  emailNotifications: {
    enabled: boolean;
    albumInvite: boolean;
    albumUpdate: boolean;
  };
  download: {
    archiveSize: number;
    includeEmbeddedVideos: boolean;
  };
  purchase: {
    showSupportBadge: boolean;
    hideBuyButtonUntil: string;
  };
}

export const getDefaultPreferences = (user: { email: string }): UserPreferences => {
  const values = Object.values(UserAvatarColor);
  const randomIndex = Math.floor(
    [...user.email].map((letter) => letter.codePointAt(0) ?? 0).reduce((a, b) => a + b, 0) % values.length,
  );

  return {
    folders: {
      enabled: false,
      sidebarWeb: false,
    },
    memories: {
      enabled: true,
    },
    people: {
      enabled: true,
      sidebarWeb: false,
    },
    ratings: {
      enabled: false,
    },
    tags: {
      enabled: false,
      sidebarWeb: false,
    },
    avatar: {
      color: values[randomIndex],
    },
    emailNotifications: {
      enabled: true,
      albumInvite: true,
      albumUpdate: true,
    },
    download: {
      archiveSize: HumanReadableSize.GiB * 4,
      includeEmbeddedVideos: false,
    },
    purchase: {
      showSupportBadge: true,
      hideBuyButtonUntil: new Date(2022, 1, 12).toISOString(),
    },
  };
};

export interface UserMetadata extends Record<UserMetadataKey, Record<string, any>> {
  [UserMetadataKey.PREFERENCES]: DeepPartial<UserPreferences>;
  [UserMetadataKey.LICENSE]: { licenseKey: string; activationKey: string; activatedAt: Date };
}
