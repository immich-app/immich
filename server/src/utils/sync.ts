import { SyncItem } from 'src/dtos/sync.dto';
import { SyncEntityType } from 'src/enum';
import { SyncAck } from 'src/types';

type Impossible<K extends keyof any> = {
  [P in K]: never;
};

type Exact<T, U extends T = T> = U & Impossible<Exclude<keyof U, keyof T>>;

export const fromAck = (ack: string): SyncAck => {
  const [type, updateId, extraId] = ack.split('|');
  return { type: type as SyncEntityType, updateId, extraId };
};

export const toAck = ({ type, updateId, extraId }: SyncAck) =>
  [type, updateId, extraId].filter((v) => v !== undefined).join('|');

export const mapJsonLine = (object: unknown) => JSON.stringify(object) + '\n';

export const serialize = <T extends keyof SyncItem, D extends SyncItem[T]>({
  type,
  data,
  ids,
  ackType,
}: {
  type: T;
  data: Exact<SyncItem[T], D>;
  ids: [string] | [string, string];
  ackType?: SyncEntityType;
}) => mapJsonLine({ type, data, ack: toAck({ type: ackType ?? type, updateId: ids[0], extraId: ids[1] }) });
