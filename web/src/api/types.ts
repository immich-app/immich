import type { Configuration } from '@immich/sdk/axios';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ApiFp = (configuration: Configuration) => Record<any, (...arguments_: any) => any>;

export type OmitLast<T extends readonly unknown[]> = T extends readonly [...infer U, any?] ? U : [...T];

export type ApiParams<F extends ApiFp, K extends keyof ReturnType<F>> = OmitLast<Parameters<ReturnType<F>[K]>>;
