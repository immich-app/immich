import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('geodata_places', { synchronize: false })
export class GeodataPlacesEntity {
  @PrimaryColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'float' })
  longitude!: number;

  @Column({ type: 'float' })
  latitude!: number;

  // @Column({
  //   generatedType: 'STORED',
  //   asExpression: 'll_to_earth((latitude)::double precision, (longitude)::double precision)',
  //   type: 'earth',
  // })
  // earthCoord!: unknown;

  @Column({ type: 'char', length: 2 })
  countryCode!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  admin1Code!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  admin2Code!: string;

  @Column({ type: 'varchar', nullable: true })
  admin1Name!: string;

  @Column({ type: 'varchar', nullable: true })
  admin2Name!: string;

  @Column({ type: 'varchar', nullable: true })
  alternateNames!: string;

  @Column({ type: 'date' })
  modificationDate!: Date;
}
