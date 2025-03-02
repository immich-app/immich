import { SyncItem } from 'src/dtos/sync.dto';
import { SyncEntityType } from 'src/enum';
import { SyncAck } from 'src/types';

type Impossible<K extends keyof any> = {
  [P in K]: never;
};

type Exact<T, U extends T = T> = U & Impossible<Exclude<keyof U, keyof T>>;

export const fromAck = (ack: string): SyncAck => {
  const [type, updateId] = ack.split('|');
  return { type: type as SyncEntityType, updateId };
};

export const toAck = ({ type, updateId }: SyncAck) => [type, updateId].join('|');

export const mapJsonLine = (object: unknown) => JSON.stringify(object) + '\n';

export const serialize = <T extends keyof SyncItem, D extends SyncItem[T]>({
  type,
  updateId,
  data,
}: {
  type: T;
  updateId: string;
  data: Exact<SyncItem[T], D>;
}) => mapJsonLine({ type, data, ack: toAck({ type, updateId }) });
