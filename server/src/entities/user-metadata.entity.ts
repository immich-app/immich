import { UserEntity } from 'src/entities/user.entity';
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

export enum UserAvatarColor {
  PRIMARY = 'primary',
  PINK = 'pink',
  RED = 'red',
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green',
  PURPLE = 'purple',
  ORANGE = 'orange',
  GRAY = 'gray',
  AMBER = 'amber',
}

export interface UserPreferences {
  memories: {
    enabled: boolean;
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
  };
}

export const getDefaultPreferences = (user: { email: string }): UserPreferences => {
  const values = Object.values(UserAvatarColor);
  const randomIndex = Math.floor(
    [...user.email].map((letter) => letter.codePointAt(0) ?? 0).reduce((a, b) => a + b, 0) % values.length,
  );

  return {
    memories: {
      enabled: true,
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
    },
  };
};

export enum UserMetadataKey {
  PREFERENCES = 'preferences',
  LICENSE = 'license',
}

export interface UserMetadata extends Record<UserMetadataKey, Record<string, any>> {
  [UserMetadataKey.PREFERENCES]: DeepPartial<UserPreferences>;
  [UserMetadataKey.LICENSE]: { licenseKey: string; activationKey: string; activatedAt: Date };
}
