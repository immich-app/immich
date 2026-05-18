import type { WorkflowType } from 'src/enum.js';
import { hostFunctions } from 'src/host-functions.js';
import type {
  ConfigValue,
  WorkflowEventPayload,
  WorkflowResponse,
} from 'src/types.js';

export const wrapper = <
  T extends WorkflowType = WorkflowType,
  TConfig extends ConfigValue = ConfigValue,
>(
  fn: (
    payload: WorkflowEventPayload<T, TConfig> & {
      functions: ReturnType<typeof hostFunctions>;
    },
  ) => WorkflowResponse<T> | undefined,
) => {
  const input = Host.inputString();

  try {
    const event = JSON.parse(input) as WorkflowEventPayload<T, TConfig>;
    // const debug = event.workflow.debug ?? false;

    console.debug(
      `Inputs: trigger=${event.trigger}, event=${event.type}, config=${JSON.stringify(event.config)}`,
    );

    const response =
      fn({ ...event, functions: hostFunctions(event.workflow.authToken) }) ??
      {};

    console.debug(
      `Outputs: workflow=${JSON.stringify(response.workflow)}, changes=${JSON.stringify(response.changes)}, data=${JSON.stringify(response.data)}`,
    );

    const output = JSON.stringify(response);
    Host.outputString(output);
  } catch (error: Error | any) {
    console.error(`Unhandled plugin exception: ${error.message || error}`);
    throw error;
  }
};
