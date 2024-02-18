import { constants, open, unlink } from "node:fs/promises";
import { join } from "node:path";
import { Readable, Writable } from "node:stream";

export class LocalFS {
        constructor(private dir: string) { }

        async create(name: string): Promise<Writable> {
                const file = await open(join(this.dir, name), constants.O_WRONLY);
                return file.createWriteStream();
        }

        async open(name: string): Promise<Readable> {
                const file = await open(join(this.dir, name), constants.O_RDONLY);
                return file.createReadStream();
        }

        async remove(name: string): Promise<void> {
                await unlink(join(this.dir, name));
        }
}
