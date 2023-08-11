import sharp from 'sharp';
import { is_string } from './isstring';
import { preload_cr2_as_tiff } from './cr2';

export async function safe_sharp(
    input?:
        | Buffer
        | Uint8Array
        | Uint8ClampedArray
        | Int8Array
        | Uint16Array
        | Int16Array
        | Uint32Array
        | Int32Array
        | Float32Array
        | Float64Array
        | string,
    options?: sharp.SharpOptions
    ): Promise<sharp.Sharp> {
    if ( input != undefined && input != null) {
        if (is_string(input)) {
            input = await preload_cr2_as_tiff((input as string))
        }
        if (input instanceof Buffer) {
            input = await preload_cr2_as_tiff((input as Buffer))
        }
    }

    return await sharp(input,options);
}