import { Column, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table({ name: 'naturalearth_countries' })
export class NaturalEarthCountriesTable {
  @PrimaryGeneratedColumn({ strategy: 'identity' })
  id!: number;

  @Column({ type: 'character varying', length: 50 })
  admin!: string;

  @Column({ type: 'character varying', length: 3 })
  admin_a3!: string;

  @Column({ type: 'character varying', length: 50 })
  type!: string;

  @Column({ type: 'polygon' })
  coordinates!: string;
}
