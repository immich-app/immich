import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GeodataPlacesEntity } from './geodata-places.entity';

@Entity('geodata_alternate_names')
export class GeodataAlternateNameEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => GeodataPlacesEntity, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  geodata!: GeodataPlacesEntity;
}
