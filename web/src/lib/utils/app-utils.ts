import { ModuleKind, transpileModule } from 'typescript';

export const transpileFile = (content: string) => {
  const result = transpileModule(content, {
    compilerOptions: { module: ModuleKind.ES2020, removeComments: true },
  });
  return result.outputText;
};
