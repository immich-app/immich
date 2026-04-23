import { Column, CreateDateColumn, Generated, PrimaryGeneratedColumn, Table, Timestamp } from '@immich/sql-tools';

export type OAuthLinkTokenProfile = {
  name: string;
  storageLabel: string | null;
  storageQuotaInGiB: number | null;
  isAdmin: boolean;
  picture: string | null;
};

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

  @Column()
  email!: string;

  @Column({ type: 'jsonb', nullable: true })
  profile!: OAuthLinkTokenProfile | null;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Timestamp;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
