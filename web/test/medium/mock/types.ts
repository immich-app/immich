import type { Request } from '@playwright/test';

type Sdk = typeof import('@immich/sdk');
type FunctionKeys<T> = { [K in keyof T]-?: T[K] extends (...args: never[]) => unknown ? K : never }[keyof T];

export type OperationId = FunctionKeys<Sdk>;
export type ResponseOf<K extends OperationId> = Awaited<ReturnType<Sdk[K]>>;
type Arguments<K extends OperationId> = 2 extends Parameters<Sdk[K]>['length']
  ? NonNullable<Parameters<Sdk[K]>[0]>
  : Record<never, never>;

type BodyKey<A> = Extract<keyof A, `${string}Dto`>;
type Params<A> = Omit<A, BodyKey<A>>;
type OptionalKeys<T> = { [K in keyof T]-?: object extends Pick<T, K> ? K : never }[keyof T];
type ParamsPart<A> = [keyof Params<A>] extends [never]
  ? unknown
  : keyof Params<A> extends OptionalKeys<Params<A>>
    ? { params?: Params<A> }
    : { params: Params<A> };
type BodyPart<A> = [BodyKey<A>] extends [never] ? unknown : { body: A[BodyKey<A>] };

export type Call<K extends OperationId> = ParamsPart<Arguments<K>> & BodyPart<Arguments<K>>;

export type HandlerContext<K extends OperationId> = Call<K> & { request: Request };

type Headers = Record<string, string>;

export type HandlerResult<K extends OperationId> =
  | { status?: 200 | 201; json: ResponseOf<K>; headers?: Headers }
  | { status: number; json?: unknown; headers?: Headers }
  | { status?: number; body: Buffer | string; contentType: string; headers?: Headers }
  | undefined;

export type Handler<K extends OperationId> = (
  context: HandlerContext<K>,
) => HandlerResult<K> | Promise<HandlerResult<K>>;

export type Handlers = { [K in OperationId]?: Handler<K> };
