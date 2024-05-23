import { UserEntity } from 'src/entities/user.entity';
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
  };
};

export enum UserMetadataKey {
  PREFERENCES = 'preferences',
}

export interface UserMetadata extends Record<UserMetadataKey, Record<string, any>> {
  [UserMetadataKey.PREFERENCES]: DeepPartial<UserPreferences>;
}
