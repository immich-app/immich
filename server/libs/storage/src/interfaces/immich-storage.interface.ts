export interface IImmichStorage {
  write(): Promise<void>;
  read(): Promise<void>;
}
