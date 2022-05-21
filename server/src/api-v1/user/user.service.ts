import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) { }

  async getAllUsers(authUser: AuthUserDto, isAll: boolean) {

    if (isAll) {
      return await this.userRepository.find();
    }

    return await this.userRepository.find({
      where: { id: Not(authUser.id) },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async getUserCount(isAdmin: boolean) {
    let users;

    if (isAdmin) {
      users = await this.userRepository.find({ where: { isAdmin: true } });
    } else {
      users = await this.userRepository.find();
    }


    return {
      userCount: users.length
    }

  }

  async createUser(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({ where: { email: createUserDto.email } });

    if (user) {
      throw new BadRequestException('User exists');
    }

    const newUser = new UserEntity();
    newUser.email = createUserDto.email;
    newUser.salt = await bcrypt.genSalt();
    newUser.password = await this.hashPassword(createUserDto.password, newUser.salt);
    newUser.firstName = createUserDto.firstName;
    newUser.lastName = createUserDto.lastName;
    newUser.isAdmin = false;


    try {
      const savedUser = await this.userRepository.save(newUser);

      return {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        createdAt: savedUser.createdAt,
      };

    } catch (e) {
      Logger.error(e, 'Create new user');
      throw new InternalServerErrorException('Failed to register new user');
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }


  async updateUser(updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne(updateUserDto.id);

    user.lastName = updateUserDto.lastName || user.lastName;
    user.firstName = updateUserDto.firstName || user.firstName;
    user.profileImagePath = updateUserDto.profileImagePath || user.profileImagePath;
    user.isFirstLoggedIn = updateUserDto.isFirstLoggedIn || user.isFirstLoggedIn;

    // If payload includes password - Create new password for user
    if (updateUserDto.password) {
      user.salt = await bcrypt.genSalt();
      user.password = await this.hashPassword(updateUserDto.password, user.salt);
    }

    if (updateUserDto.isAdmin) {
      const adminUser = await this.userRepository.findOne({ where: { isAdmin: true } })

      if (adminUser) {
        throw new BadRequestException("Admin user exists")
      }

      user.isAdmin = true;
    }

    try {
      const updatedUser = await this.userRepository.save(user);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isAdmin: updatedUser.isAdmin,
        profileImagePath: updatedUser.profileImagePath,
      };

    } catch (e) {
      Logger.error(e, 'Create new user');
      throw new InternalServerErrorException('Failed to register new user');
    }
  }
}
