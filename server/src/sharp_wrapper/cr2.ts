import dcraw from 'dcraw';
import {getType,getTypeFromBuffer} from 'js-img-type'
import fs from 'fs/promises';
import { Logger } from '@nestjs/common';
import { is_string } from './isstring';

const logger = new Logger("Detection of CR2 files");



export async function  preload_cr2_as_tiff(input: string | Buffer): Promise<string | Buffer> {
  logger.debug(is_string(input) ? "A file name is provided":"A buffer is provided");  

  const ftype = await (is_string(input) ? 
    getType((input as string)):
    getTypeFromBuffer((input as Buffer)))

  logger.debug("Detected type : {ftype}".replace("{ftype}",ftype));

  if ( typeof ftype === 'string' && (ftype as string) == 'cr2') {
    if (is_string(input)) {
      logger.log("C'est un CR2 je précharge");

      input = await fs.readFile(input)
    }
    input = dcraw(input, { exportAsTiff: true })
  }

  return new Promise<string | Buffer>(function (resolve, reject) {
    resolve(
      input
    );
  })                     
  
}