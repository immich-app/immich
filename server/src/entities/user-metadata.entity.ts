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
  metadata: {
    folder: {
      enabled: boolean;
    };
    memory: {
      enabled: boolean;
    };
    people: {
      enabled: boolean;
    };
    rating: {
      enabled: boolean;
    };
    tag: {
      enabled: boolean;
    };
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
    metadata: {
      folder: {
        enabled: false,
      },
      memory: {
        enabled: true,
      },
      people: {
        enabled: false,
      },
      rating: {
        enabled: false,
      },
      tag: {
        enabled: false,
      },
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
