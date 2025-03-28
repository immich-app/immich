import { Column, PrimaryColumn, Table } from 'src/sql-tools';

@Table({ name: 'geodata_places', synchronize: false })
export class GeodataPlacesTable {
  @PrimaryColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'character varying', length: 200 })
  name!: string;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'character', length: 2 })
  countryCode!: string;

  @Column({ type: 'character varying', length: 20, nullable: true })
  admin1Code!: string;

  @Column({ type: 'character varying', length: 80, nullable: true })
  admin2Code!: string;

  @Column({ type: 'character varying', nullable: true })
  admin1Name!: string;

  @Column({ type: 'character varying', nullable: true })
  admin2Name!: string;

  @Column({ type: 'character varying', nullable: true })
  alternateNames!: string;

  @Column({ type: 'date' })
  modificationDate!: Date;
}

@Table({ name: 'geodata_places_tmp', synchronize: false })
export class GeodataPlacesTempEntity {
  @PrimaryColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'character varying', length: 200 })
  name!: string;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'character', length: 2 })
  countryCode!: string;

  @Column({ type: 'character varying', length: 20, nullable: true })
  admin1Code!: string;

  @Column({ type: 'character varying', length: 80, nullable: true })
  admin2Code!: string;

  @Column({ type: 'character varying', nullable: true })
  admin1Name!: string;

  @Column({ type: 'character varying', nullable: true })
  admin2Name!: string;

  @Column({ type: 'character varying', nullable: true })
  alternateNames!: string;

  @Column({ type: 'date' })
  modificationDate!: Date;
}
