import { Injectable } from '@nestjs/common';
import { ServerInfoResponseDto } from './response-dto/server-info-response.dto';
import diskusage from 'diskusage';
import { APP_UPLOAD_LOCATION } from '../../constants/upload_location.constant';

@Injectable()
export class ServerInfoService {
  async getServerInfo(): Promise<ServerInfoResponseDto> {
    const diskInfo = await diskusage.check(APP_UPLOAD_LOCATION);

    const usagePercentage = (((diskInfo.total - diskInfo.free) / diskInfo.total) * 100).toFixed(2);

    const serverInfo = new ServerInfoResponseDto();
    serverInfo.diskAvailable = ServerInfoService.getHumanReadableString(diskInfo.available);
    serverInfo.diskSize = ServerInfoService.getHumanReadableString(diskInfo.total);
    serverInfo.diskUse = ServerInfoService.getHumanReadableString(diskInfo.total - diskInfo.free);
    serverInfo.diskAvailableRaw = diskInfo.available;
    serverInfo.diskSizeRaw = diskInfo.total;
    serverInfo.diskUseRaw = diskInfo.total - diskInfo.free;
    serverInfo.diskUsagePercentage = parseFloat(usagePercentage);

    return serverInfo;
  }

  private static getHumanReadableString(sizeInByte: number) {
    const pepibyte = 1.126 * Math.pow(10, 15);
    const tebibyte = 1.1 * Math.pow(10, 12);
    const gibibyte = 1.074 * Math.pow(10, 9);
    const mebibyte = 1.049 * Math.pow(10, 6);
    const kibibyte = 1024;
    // Pebibyte
    if (sizeInByte >= pepibyte) {
      // Pe
      return `${(sizeInByte / pepibyte).toFixed(1)}PB`;
    } else if (tebibyte <= sizeInByte && sizeInByte < pepibyte) {
      // Te
      return `${(sizeInByte / tebibyte).toFixed(1)}TB`;
    } else if (gibibyte <= sizeInByte && sizeInByte < tebibyte) {
      // Gi
      return `${(sizeInByte / gibibyte).toFixed(1)}GB`;
    } else if (mebibyte <= sizeInByte && sizeInByte < gibibyte) {
      // Mega
      return `${(sizeInByte / mebibyte).toFixed(1)}MB`;
    } else if (kibibyte <= sizeInByte && sizeInByte < mebibyte) {
      // Kibi
      return `${(sizeInByte / kibibyte).toFixed(1)}KB`;
    } else {
      return `${sizeInByte}B`;
    }
  }
}
