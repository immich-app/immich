import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../api-v1/user/entities/user.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcrypt';
import { JwtPayloadDto } from '../../api-v1/auth/dto/jwt-payload.dto';

@Injectable()
export class ImmichAuthService {

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async createUser(email: string, localUser: boolean, password: string | null, firstName = "", lastName = "", isAdmin = false) {
    const registerUser = await this.userRepository.findOne({ email: email });

    if (registerUser) {
      throw new BadRequestException('User already exists');
    }

    const newUser = new UserEntity();
    newUser.email = email;
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.isAdmin = isAdmin;
    if (localUser) {
      if (password === null) throw new InternalServerErrorException();
      newUser.salt = await bcrypt.genSalt();
      newUser.password = await ImmichAuthService.hashPassword(password, newUser.salt);
      newUser.isLocalUser = true;
    } else {
      newUser.isLocalUser = false;
    }

    return await this.userRepository.save(newUser);
  }

  async createAdmin(email: string, localUser: boolean, password: string | null, firstName = "", lastName = "") {
    const adminUser = await this.userRepository.findOne({ where: { isAdmin: true } });

    if (adminUser) {
      throw new BadRequestException('Admin user already exists');
    }

    return await this.createUser(email, localUser, password, firstName, lastName, true);
  }

  private static async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}