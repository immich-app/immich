import { Column, Index, PrimaryColumn, Table, Timestamp } from 'src/sql-tools';

@Table({ name: 'geodata_places', primaryConstraintName: 'geodata_places_pkey' })
@Index({
  name: 'idx_geodata_places_alternate_names',
  using: 'gin',
  expression: 'f_unaccent("alternateNames") gin_trgm_ops',
})
@Index({
  name: 'idx_geodata_places_admin1_name',
  using: 'gin',
  expression: 'f_unaccent("admin1Name") gin_trgm_ops',
})
@Index({
  name: 'idx_geodata_places_admin2_name',
  using: 'gin',
  expression: 'f_unaccent("admin2Name") gin_trgm_ops',
})
@Index({
  name: 'idx_geodata_places_name',
  using: 'gin',
  expression: 'f_unaccent("name") gin_trgm_ops',
})
@Index({
  name: 'IDX_geodata_gist_earthcoord',
  expression: 'll_to_earth_public(latitude, longitude)',
})
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
  admin1Code!: string | null;

  @Column({ type: 'character varying', length: 80, nullable: true })
  admin2Code!: string | null;

  @Column({ type: 'date' })
  modificationDate!: Timestamp;

  @Column({ type: 'character varying', nullable: true })
  admin1Name!: string | null;

  @Column({ type: 'character varying', nullable: true })
  admin2Name!: string | null;

  @Column({ type: 'character varying', nullable: true })
  alternateNames!: string | null;
}
