import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('geodata_admin1')
export class GeodataAdmin1Entity {
  @PrimaryColumn({ type: 'varchar' })
  key!: string;

  @Column({ type: 'varchar' })
  name!: string;
}
