import { Column, Entity, PrimaryGeneratedColumn, PrimaryColumn, Polygon } from 'typeorm';

@Entity('ne_10m_admin_0_countries_test', { synchronize: false })
export class NaturalEarthCountriesEntityTest {
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
