export interface ImmichStorageInterface {
  write(): Promise<void>;
  read(): Promise<void>;
}
