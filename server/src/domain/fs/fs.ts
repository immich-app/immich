import { Readable, Writable } from "node:stream";

export interface FS {
  // create creates an object with the given name.
  create(name: string): Promise<Writable>;

  // open opens the named object.
  open(name: string): Promise<Readable>;

  // remove removes the named object.
  remove(name: string): Promise<void>;
}

// export interface FS {
//   // create creates an object with the given name.
//   create(name: string): Promise<WritableFile>;

//   // open opens the object with the given name.
//   open(name: string): Promise<ReadableFile>;

//   // remove removes the named object.
//   remove(name: string): Promise<void>;
// }

// export interface File {
//   createReadableStream(): Promise<Readable>;
// }
