import { AssetEntity } from '@app/database/entities/asset.entity';
import { SmartInfoEntity } from '@app/database/entities/smart-info.entity';
import { ocrProcessorName, QueueNameEnum } from '@app/job';
import { IOcrJob } from '@app/job/interfaces/ocr.interface';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import fs from 'node:fs';

const immich_ocr_url = process.env.IMMICH_OCR_URL || 'http://immich-ocr:3004';


@Processor(QueueNameEnum.OCR)
export class OcrProcessor {
    constructor(
        @InjectRepository(SmartInfoEntity)
        private smartInfoRepository: Repository<SmartInfoEntity>,
    ) { }

    @Process({ name: ocrProcessorName, concurrency: 1 })
    async tagImage(job: Job<IOcrJob>) {
        const { asset } = job.data;
        Logger.log(`Start Image OCR ${asset.originalPath}`);

        // Create a base64 string from an image => ztso+Mfuej2mPmLQxgD ...
        const base64 = fs.readFileSync(asset.originalPath, "base64");
        // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
        const buffer = Buffer.from(base64, "base64");

        Logger.log(`Image Base64 ${base64.length}`);

        //Logger.log(`Send Image ${asset.originalPath}`);
        const config = {
            maxContentLength: 50000000,
            maxBodyLength: 50000000,
            };
        const res = await axios.post(immich_ocr_url+'/ocr/prediction',
            {
                key: ["image"],
                value: [base64]
            },
            config
        );
        //Logger.log(`End Image OCR ${asset.originalPath}`);

        //console.trace('Failed to generate webp thumbnail for asset', res.data);
        Logger.log(`res.status: ${res.status}`)
        if (res.status == 200 && 0==res.data['err_no']) {
            //Logger.log(`res.status: ${res.status},err_no: ${res.data['err_no']},err_msg: ${res.data['err_msg']},key: ${res.data['key']},value: ${res.data['value']}`);
            const ocr_info=res.data['value'][0]
            const ocr_objs = JSON.parse(ocr_info);
            //Logger.log(`obj: ${ocr_objs}`);
    
            let fullstring=""
            ocr_objs.forEach((obj: Array<any>) => {
                fullstring=fullstring+obj[0][0];
                //Logger.log(`string: ${obj[0][0]},num: ${obj[0][1]},num0x: ${obj[1][0][0]}`);
            });


            //Logger.log(`res.status: ${res.status},res.data: ${res.data['value'][0]}`);

            const smartInfo = new SmartInfoEntity();
            smartInfo.assetId = asset.id;
            
            smartInfo.ocr_info = ocr_info;
            smartInfo.ocr_string = fullstring;

            await this.smartInfoRepository.upsert(smartInfo, {
                conflictPaths: ['assetId'],
            });
        }
        else
        {
            Logger.log(`提取失败 res.status: ${res.status},res.data: ${res.data}`);
            console.trace('Failed to generate webp thumbnail for asset', res.data);
        }
        Logger.log(`End Image OCR ${asset.resizePath}`);
    }
}

