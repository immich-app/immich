export const replaceTemplateTags = (template: string, variables: Record<string, string | null | undefined>) => {
  return template.replaceAll(/{(.*?)}/g, (_, key) => {
    return variables[key] ?? `{${key}}`;
  });
};
