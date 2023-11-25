import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('geodata_admin2')
export class GeodataAdmin2Entity {
  @PrimaryColumn({ type: 'varchar' })
  key!: string;

  @Column({ type: 'varchar' })
  name!: string;
}
