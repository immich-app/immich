import { getUserConfig, type UserConfigDto } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';
import { cloneDeep } from 'lodash-es';

const withEffectiveFlags = (dto: UserConfigDto) => {
  const config = cloneDeep(dto);
  const { machineLearning } = config;

  if (!machineLearning.enabled) {
    machineLearning.clip.enabled = false;
    machineLearning.facialRecognition.enabled = false;
    machineLearning.ocr.enabled = false;
  }

  if (!machineLearning.clip.enabled) {
    machineLearning.duplicateDetection.enabled = false;
  }

  return config;
};

export const getUserConfigQuery = () =>
  queryOptions({
    queryKey: ['config', 'user'],
    queryFn: ({ signal }) => getUserConfig({ signal }),
    gcTime: Infinity,
    select: withEffectiveFlags,
  });
