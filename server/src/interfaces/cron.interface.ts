export const ICronRepository = 'ICronRepository';

type CronBase = {
  name: string;
  start?: boolean;
};

export type CronCreate = CronBase & {
  expression: string;
  onTick: () => void;
};

export type CronUpdate = CronBase & {
  expression?: string;
};

export interface ICronRepository {
  create(cron: CronCreate): void;
  update(cron: CronUpdate): void;
}
