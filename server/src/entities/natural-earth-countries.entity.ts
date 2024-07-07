import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('naturalearth_countries', { synchronize: false })
export class NaturalEarthCountriesEntity {
  @PrimaryGeneratedColumn()
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
