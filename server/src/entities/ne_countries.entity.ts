import { Column, Entity, PrimaryColumn, Polygon } from 'typeorm';

@Entity('ne_10m_admin_0_countries_dump', { synchronize: false })
export class NaturalEarthCountriesEntity {
  @PrimaryColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'varchar' })
  sovereignt!: string;

  @Column({ type: 'varchar' })
  admin!: string;

  @Column({ type: 'integer' })
  adm0_dif!: number;

  @Column({ type: 'varchar' })
  name_long!: string;

  @Column({ type: 'polygon', nullable: true })
  poly!: Polygon;

}
