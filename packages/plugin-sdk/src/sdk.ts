import { hostFunctions } from 'src/host-functions.js';
import type {
  WorkflowEventPayload,
  WorkflowResponse,
  WorkflowStepConfig,
} from 'src/types.js';

type Property = {
  type: 'string' | 'boolean' | 'number';
  array?: boolean;
  enum?: string[];
} & {
  type: 'object';
  properties: { [K: string]: Property };
  required?: string[];
};

type RequiredProperties<
  Properties extends { [K: string]: unknown },
  Required extends string[] | undefined,
  RequiredKeys extends string = Required extends undefined
    ? never
    : NonNullable<Required>[number],
> = {
  properties: Pick<Properties, RequiredKeys> &
    Partial<Omit<Properties, RequiredKeys>>;
};

type GetConfigType<T extends Property> = 'enum' extends keyof T
  ? NonNullable<T['enum']>[number]
  : T['type'] extends 'boolean'
    ? boolean
    : T['type'] extends 'number'
      ? number
      : T['type'] extends 'string'
        ? string
        : T['type'] extends 'object'
          ? ConfigValue<T>
          : never;

type ConfigValue<
  T extends { properties: { [K: string]: Property }; required?: string[] },
  Properties extends { [K: string]: Property } = T['properties'],
> = T extends never
  ? never
  : RequiredProperties<
      {
        [K in keyof Properties]: Properties[K]['array'] extends true
          ? Array<GetConfigType<Properties[K]>>
          : GetConfigType<Properties[K]>;
      },
      'required' extends keyof T ? T['required'] : undefined
    >['properties'];

export const wrapper = <T extends Record<string, any>>(methods: {
  [K in T['methods'][number] as K['name']]: (
    payload: WorkflowEventPayload<
      K['types'][number],
      ConfigValue<K['schema']>
    > & {
      functions: ReturnType<typeof hostFunctions>;
    },
  ) => WorkflowResponse<K['types'][number]> | undefined;
}) => {
  const result: { [K in keyof typeof methods]: () => void } = {} as never;
  for (const name of Object.keys(methods) as (keyof typeof methods)[]) {
    result[name] = () => {
      const input = Host.inputString();

      try {
        const payload = JSON.parse(input) as WorkflowEventPayload<
          typeof name,
          (T['methods'][number]['name'] & { name: typeof name })['schema']
        >;
        const event = {
          ...payload,
          functions: hostFunctions(payload.workflow.authToken),
        };

        const eventConfigBefore = JSON.stringify(event.config);

        console.debug(
          `Inputs: trigger=${event.trigger}, event=${String(event.type)}, config=${eventConfigBefore}`,
        );

        const response = methods[name](event) ?? {};

        // if config changed, notify host
        const eventConfigAfter = JSON.stringify(event.config);
        if (!response.config && eventConfigBefore !== eventConfigAfter) {
          response.config = event.config as WorkflowStepConfig;
        }

        console.debug(
          `Outputs: workflow=${JSON.stringify(response.workflow)}, changes=${JSON.stringify(response.changes)}, data=${JSON.stringify(response.data)}, config=${JSON.stringify(response.config)}`,
        );

        const output = JSON.stringify(response);
        Host.outputString(output);
      } catch (error: Error | any) {
        console.error(`Unhandled plugin exception: ${error.message || error}`);
        throw error;
      }
    };
  }
  return result;
};
