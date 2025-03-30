import { Column, PrimaryColumn, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table({ name: 'naturalearth_countries', synchronize: false })
export class NaturalEarthCountriesTable {
  @PrimaryColumn({ type: 'serial' })
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

@Table({ name: 'naturalearth_countries_tmp', synchronize: false })
export class NaturalEarthCountriesTempTable {
  @PrimaryGeneratedColumn()
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
