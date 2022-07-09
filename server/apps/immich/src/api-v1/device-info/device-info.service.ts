import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateDeviceInfoDto } from './dto/create-device-info.dto';
import { UpdateDeviceInfoDto } from './dto/update-device-info.dto';
import { DeviceInfoEntity } from '@app/database/entities/device-info.entity';
import { DeviceInfoResponseDto, mapDeviceInfoResponse } from './response-dto/create-device-info-response.dto';

@Injectable()
export class DeviceInfoService {
  constructor(
    @InjectRepository(DeviceInfoEntity)
    private deviceRepository: Repository<DeviceInfoEntity>,
  ) {}

  async create(createDeviceInfoDto: CreateDeviceInfoDto, authUser: AuthUserDto): Promise<DeviceInfoResponseDto> {
    const res = await this.deviceRepository.findOne({
      where: {
        deviceId: createDeviceInfoDto.deviceId,
        userId: authUser.id,
      },
    });

    if (res) {
      Logger.log('Device Info Exist', 'createDeviceInfo');
      return mapDeviceInfoResponse(res);
    }

    const deviceInfo = new DeviceInfoEntity();
    deviceInfo.deviceId = createDeviceInfoDto.deviceId;
    deviceInfo.deviceType = createDeviceInfoDto.deviceType;
    deviceInfo.userId = authUser.id;

    const newDeviceInfo = await this.deviceRepository.save(deviceInfo);

    return mapDeviceInfoResponse(newDeviceInfo);
  }

  async update(userId: string, updateDeviceInfoDto: UpdateDeviceInfoDto): Promise<DeviceInfoResponseDto> {
    const deviceInfo = await this.deviceRepository.findOne({
      where: { deviceId: updateDeviceInfoDto.deviceId, userId: userId },
    });

    if (!deviceInfo) {
      throw new NotFoundException('Device Not Found');
    }

    const res = await this.deviceRepository.update(
      {
        id: deviceInfo.id,
      },
      updateDeviceInfoDto,
    );

    if (res.affected == 1) {
      const updatedDeviceInfo = await this.deviceRepository.findOne({
        where: { deviceId: updateDeviceInfoDto.deviceId, userId: userId },
      });

      if (!updatedDeviceInfo) {
        throw new NotFoundException('Device Not Found');
      }

      return mapDeviceInfoResponse(updatedDeviceInfo);
    } else {
      throw new BadRequestException('Bad Request');
    }
  }
}
