import { SyncItem } from 'src/dtos/sync.dto';
import { SyncEntityType } from 'src/enum';
import { SyncAck } from 'src/types';

type Impossible<K extends keyof any> = {
  [P in K]: never;
};

type Exact<T, U extends T = T> = U & Impossible<Exclude<keyof U, keyof T>>;

export const fromAck = (ack: string): SyncAck => {
  const [type, timestamp, ...ids] = ack.split('|');
  return { type: type as SyncEntityType, ackEpoch: timestamp, ids };
};

export const toAck = ({ type, ackEpoch, ids }: SyncAck) => [type, ackEpoch, ...ids].join('|');

export const mapJsonLine = (object: unknown) => JSON.stringify(object) + '\n';

export const serialize = <T extends keyof SyncItem, D extends SyncItem[T]>({
  type,
  ackEpoch,
  ids,
  data,
}: {
  type: T;
  ackEpoch: string;
  ids: string[];
  data: Exact<SyncItem[T], D>;
}) => mapJsonLine({ type, data, ack: toAck({ type, ackEpoch, ids }) });
