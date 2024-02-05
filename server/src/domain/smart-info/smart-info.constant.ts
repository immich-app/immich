export type ModelInfo = {
  dimSize: number;
};

export const CLIP_MODEL_INFO: Record<string, ModelInfo> = {
  RN50__openai: {
    dimSize: 1024,
  },
  RN50__yfcc15m: {
    dimSize: 1024,
  },
  RN50__cc12m: {
    dimSize: 1024,
  },
  RN101__openai: {
    dimSize: 512,
  },
  RN101__yfcc15m: {
    dimSize: 512,
  },
  RN50x4__openai: {
    dimSize: 640,
  },
  RN50x16__openai: {
    dimSize: 768,
  },
  RN50x64__openai: {
    dimSize: 1024,
  },
  'ViT-B-32__openai': {
    dimSize: 512,
  },
  'ViT-B-32__laion2b_e16': {
    dimSize: 512,
  },
  'ViT-B-32__laion400m_e31': {
    dimSize: 512,
  },
  'ViT-B-32__laion400m_e32': {
    dimSize: 512,
  },
  'ViT-B-32__laion2b-s34b-b79k': {
    dimSize: 512,
  },
  'ViT-B-16__openai': {
    dimSize: 512,
  },
  'ViT-B-16__laion400m_e31': {
    dimSize: 512,
  },
  'ViT-B-16__laion400m_e32': {
    dimSize: 512,
  },
  'ViT-B-16-plus-240__laion400m_e31': {
    dimSize: 640,
  },
  'ViT-B-16-plus-240__laion400m_e32': {
    dimSize: 640,
  },
  'ViT-L-14__openai': {
    dimSize: 768,
  },
  'ViT-L-14__laion400m_e31': {
    dimSize: 768,
  },
  'ViT-L-14__laion400m_e32': {
    dimSize: 768,
  },
  'ViT-L-14__laion2b-s32b-b82k': {
    dimSize: 768,
  },
  'ViT-L-14-336__openai': {
    dimSize: 768,
  },
  'ViT-L-14-quickgelu__dfn2b': {
    dimSize: 768,
  },
  'ViT-H-14__laion2b-s32b-b79k': {
    dimSize: 1024,
  },
  'ViT-H-14-quickgelu__dfn5b': {
    dimSize: 1024,
  },
  'ViT-H-14-378-quickgelu__dfn5b': {
    dimSize: 1024,
  },
  'ViT-g-14__laion2b-s12b-b42k': {
    dimSize: 1024,
  },
  'LABSE-Vit-L-14': {
    dimSize: 768,
  },
  'XLM-Roberta-Large-Vit-B-32': {
    dimSize: 512,
  },
  'XLM-Roberta-Large-Vit-B-16Plus': {
    dimSize: 640,
  },
  'XLM-Roberta-Large-Vit-L-14': {
    dimSize: 768,
  },
  'XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k': {
    dimSize: 1024,
  },
  'nllb-clip-base-siglip__v1': {
    dimSize: 768,
  },
  'nllb-clip-large-siglip__v1': {
    dimSize: 1152,
  },
};

export function cleanModelName(modelName: string): string {
  const token = modelName.split('/').at(-1);
  if (!token) {
    throw new Error(`Invalid model name: ${modelName}`);
  }

  return token.replaceAll(':', '_');
}

export function getCLIPModelInfo(modelName: string): ModelInfo {
  const modelInfo = CLIP_MODEL_INFO[cleanModelName(modelName)];
  if (!modelInfo) {
    throw new Error(`Unknown CLIP model: ${modelName}`);
  }

  return modelInfo;
}
