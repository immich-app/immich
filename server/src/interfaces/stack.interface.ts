import { StackEntity } from 'src/entities/stack.entity';

export const IStackRepository = 'IStackRepository';

export interface IStackRepository {
  create(stack: Partial<StackEntity> & { ownerId: string }): Promise<StackEntity>;
  update(stack: Pick<StackEntity, 'id'> & Partial<StackEntity>): Promise<StackEntity>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<StackEntity | null>;
}
