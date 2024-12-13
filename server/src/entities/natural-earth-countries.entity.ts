import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('naturalearth_countries', { synchronize: false })
export class NaturalEarthCountriesEntity {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  admin!: string;

  @Column({ type: 'varchar', length: 3 })
  admin_a3!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'polygon' })
  coordinates!: string;
}

@Entity('naturalearth_countries_tmp', { synchronize: false })
export class NaturalEarthCountriesTempEntity {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  admin!: string;

  @Column({ type: 'varchar', length: 3 })
  admin_a3!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'polygon' })
  coordinates!: string;
}
