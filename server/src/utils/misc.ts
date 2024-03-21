import { CLIP_MODEL_INFO } from 'src/constants';
import { ImmichLogger } from 'src/utils/logger';

export const isConnectionAborted = (error: Error | any) => error.code === 'ECONNABORTED';

export const handlePromiseError = <T>(promise: Promise<T>, logger: ImmichLogger): void => {
  promise.catch((error: Error | any) => logger.error(`Promise error: ${error}`, error?.stack));
};

export interface OpenGraphTags {
  title: string;
  description: string;
  imageUrl?: string;
}

function cleanModelName(modelName: string): string {
  const token = modelName.split('/').at(-1);
  if (!token) {
    throw new Error(`Invalid model name: ${modelName}`);
  }

  return token.replaceAll(':', '_');
}

export function getCLIPModelInfo(modelName: string) {
  const modelInfo = CLIP_MODEL_INFO[cleanModelName(modelName)];
  if (!modelInfo) {
    throw new Error(`Unknown CLIP model: ${modelName}`);
  }

  return modelInfo;
}
