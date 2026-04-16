import { Column, CreateDateColumn, Generated, PrimaryGeneratedColumn, Table, Timestamp } from '@immich/sql-tools';

@Table({ name: 'oauth_link_token' })
export class OAuthLinkTokenTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ type: 'bytea', index: true })
  token!: Buffer;

  @Column()
  oauthSub!: string;

  @Column()
  userEmail!: string;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Timestamp;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
