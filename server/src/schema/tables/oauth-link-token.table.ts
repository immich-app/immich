import {
  Column,
  CreateDateColumn,
  type Generated,
  PrimaryGeneratedColumn,
  Table,
  type Timestamp,
} from '@immich/sql-tools';
import type { OAuthProfile } from 'src/repositories/oauth.repository.js';

@Table({ name: 'oauth_link_token' })
export class OAuthLinkTokenTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ type: 'bytea', index: true })
  token!: Buffer;

  @Column({ nullable: true })
  oauthSub!: string | null;

  @Column({ nullable: true })
  oauthSid!: string | null;

  @Column({ nullable: true })
  oauthBearerToken!: string | null;

  @Column()
  email!: string;

  @Column({ type: 'jsonb', nullable: true })
  profile!: OAuthProfile | null;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Timestamp;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
