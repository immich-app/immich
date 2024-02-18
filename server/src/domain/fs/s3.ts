import { PassThrough, Readable, Writable } from "node:stream";
import { S3 } from "@aws-sdk/client-s3";
import { FS } from "./fs";
import { Upload } from "@aws-sdk/lib-storage";

export class S3FS implements FS {
        s3: S3;

        constructor(private bucket: string) {
                this.s3 = new S3();
        }

        async create(name: string): Promise<Writable> {
                const stream = new PassThrough();
                const upload = new Upload({
                        client: this.s3,
                        params: {
                                Body: stream,
                                Bucket: this.bucket,
                                Key: name,
                        },
                });

                // Abort the upload if the stream has finished. Should be a
                // no-op if the upload has already finished.
                stream.on('close', () => upload.abort());

                // Close the stream when the upload is finished, or if it
                // failed.
                //
                // TODO: Find a way to bubble up this error.
                upload.done().then(() => void stream.end(), error => {
                        console.log(`s3 upload failed: ${error}`);
                        stream.end();
                });

                return stream;
        }

        async open(name: string): Promise<Readable> {
                const obj = await this.s3.getObject({
                        Bucket: this.bucket,
                        Key: name,
                });
                return obj.Body as Readable;
                // const stream = obj.Body?.transformToWebStream();
                // if (!stream) {
                //         throw new Error("no body");
                // }
                // return Readable.fromWeb(new ReadableStream(stream));
        }

        async remove(name: string): Promise<void> {
                await this.s3.deleteObject({
                        Bucket: this.bucket,
                        Key: name,
                })
        }
}

// class ObjectReadable extends Readable {
//         constructor(private s3: S3, private bucket: string) { }


// }
