import { IUserRepository, User, UserCreateDto, UserUpdateDto } from '@app/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserEntity } from '../entities';

export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  public async get(userId: string, withDeleted?: boolean): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId }, withDeleted: withDeleted });
  }

  public async getAdmin(): Promise<User | null> {
    return this.userRepository.findOne({ where: { isAdmin: true } });
  }

  public async getByEmail(email: string, withPassword?: boolean): Promise<User | null> {
    let builder = this.userRepository.createQueryBuilder('user').where({ email });

    if (withPassword) {
      builder = builder.addSelect('user.password');
    }

    return builder.getOne();
  }

  public async getByOAuthId(oauthId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { oauthId } });
  }

  public async getList({ excludeId }: { excludeId?: string } = {}): Promise<User[]> {
    if (!excludeId) {
      return this.userRepository.find(); // TODO: this should also be ordered the same as below
    }
    return this.userRepository.find({
      where: { id: Not(excludeId) },
      withDeleted: true,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  public async create(user: UserCreateDto): Promise<User> {
    return this.userRepository.save(user);
  }

  public async update(user: UserUpdateDto): Promise<User> {
    return this.userRepository.save(user);
  }

  public async remove(user: User): Promise<User> {
    return this.userRepository.softRemove(user);
  }

  public async restore(user: User): Promise<User> {
    return this.userRepository.recover(user);
  }
}
