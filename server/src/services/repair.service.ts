import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AUDIT_LOG_MAX_DURATION } from 'src/constants';
import { AuthDto } from 'src/dtos/auth.dto';
import { RepairEntity } from 'src/entities/repair.entity';
import { Permission, RepairType } from 'src/enum';
import { IEntityJob, JobName, JOBS_ASSET_PAGINATION_SIZE, JobStatus } from 'src/interfaces/job.interface';
import { BaseService } from 'src/services/base.service';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class RepairService extends BaseService {
  async handleVerifyChecksum(job: IEntityJob): Promise<JobStatus> {
    const assetFile = await this.assetRepository.getFileById(job.id);
    if (!assetFile) {
      this.logger.error(`Asset file not found for id: ${job.id}`);
      return JobStatus.FAILED;
    }

    if (!assetFile.checksum) {
      this.logger.error(`Asset file has no checksum, cannot verify: ${job.id}`);
      return JobStatus.FAILED;
    }
    const currentChecksum = await this.cryptoRepository.xxHashFile(assetFile.path);
    if (currentChecksum.equals(assetFile.checksum)) {
      this.logger.log(`Asset file checksum verified: ${job.id}`);
    } else {
      this.logger.error(`Asset file checksum mismatch: ${job.id}`);
      await this.repairRepository.create({ assetFile, type: RepairType.CHECKSUM_MISMATCH });
    }
    return JobStatus.SUCCESS;
  }

  async queueVerifyChecksums(auth: AuthDto): Promise<void> {
    const onlineAssets = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination),
    );

    for await (const assets of onlineAssets) {
      const fileIds = assets
        .map((asset) => asset.files)
        .flat()
        .filter((file) => file.checksum)
        .map((file) => file.id);

      await this.jobRepository.queueAll(
        fileIds.map((id) => ({
          name: JobName.REPAIR_VERIFY_CHECKSUM,
          data: { id },
        })),
      );
    }
  }

  async getRepairs(auth: AuthDto): Promise<RepairEntity[]> {
    let repairs: RepairEntity[] = [];
    const repairPages = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.repairRepository.getAll(pagination),
    );

    for await (const repairPage of repairPages) {
      repairs = repairs.concat(repairPage);
    }
    return repairs;
  }
}
