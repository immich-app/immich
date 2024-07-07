import { Column, Entity, PrimaryGeneratedColumn, PrimaryColumn, Polygon } from 'typeorm';

@Entity('naturalearth_countries', { synchronize: false })
export class NaturalEarthCountriesEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  admin!: string;

  @Column({ type: 'varchar' })
  admin_a3!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'polygon', nullable: true })
  coordinates!: string;

}
