import { Injectable } from '@nestjs/common';
import systemInformation from 'systeminformation';
import { ServerInfoDto } from './dto/server-info.dto';

@Injectable()
export class ServerInfoService {
  constructor() {}
  async getServerInfo() {
    const res = await systemInformation.fsSize();

    const size = res[0].size;
    const used = res[0].used;
    const available = res[0].available;
    const percentageUsage = res[0].use;

    const serverInfo = new ServerInfoDto();
    serverInfo.diskAvailable = this.getHumanReadableString(available);
    serverInfo.diskSize = this.getHumanReadableString(size);
    serverInfo.diskUse = this.getHumanReadableString(used);
    serverInfo.diskAvailableRaw = available;
    serverInfo.diskSizeRaw = size;
    serverInfo.diskUseRaw = used;
    serverInfo.diskUsagePercentage = percentageUsage;

    return serverInfo;
  }

  private getHumanReadableString(sizeInByte: number) {
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
