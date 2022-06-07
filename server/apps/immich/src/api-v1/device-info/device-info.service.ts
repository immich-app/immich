import { BadRequestException, HttpCode, Injectable, Logger, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateDeviceInfoDto } from './dto/create-device-info.dto';
import { UpdateDeviceInfoDto } from './dto/update-device-info.dto';
import { DeviceInfoEntity } from '@app/database/entities/device-info.entity';

@Injectable()
export class DeviceInfoService {
  constructor(
    @InjectRepository(DeviceInfoEntity)
    private deviceRepository: Repository<DeviceInfoEntity>,
  ) {}

  async create(createDeviceInfoDto: CreateDeviceInfoDto, authUser: AuthUserDto) {
    const res = await this.deviceRepository.findOne({
      deviceId: createDeviceInfoDto.deviceId,
      userId: authUser.id,
    });

    if (res) {
      Logger.log('Device Info Exist', 'createDeviceInfo');
      return res;
    }

    const deviceInfo = new DeviceInfoEntity();
    deviceInfo.deviceId = createDeviceInfoDto.deviceId;
    deviceInfo.deviceType = createDeviceInfoDto.deviceType;
    deviceInfo.userId = authUser.id;

    try {
      return await this.deviceRepository.save(deviceInfo);
    } catch (e) {
      Logger.error('Error creating new device info', 'createDeviceInfo');
    }
  }

  async update(userId: string, updateDeviceInfoDto: UpdateDeviceInfoDto) {
    const deviceInfo = await this.deviceRepository.findOne({
      where: { deviceId: updateDeviceInfoDto.deviceId, userId: userId },
    });

    if (!deviceInfo) {
      throw new BadRequestException('Device Not Found');
    }

    const res = await this.deviceRepository.update(
      {
        id: deviceInfo.id,
      },
      updateDeviceInfoDto,
    );

    if (res.affected == 1) {
      return await this.deviceRepository.findOne({
        where: { deviceId: updateDeviceInfoDto.deviceId, userId: userId },
      });
    } else {
      throw new BadRequestException('Bad Request');
    }
  }
}
