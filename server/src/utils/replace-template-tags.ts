export const replaceTemplateTags = (template: string, variables: Record<string, string | undefined>) => {
  return template.replace(/{(.*?)}/g, (_, key) => {
    return variables[key] || `{${key}}`;
  });
};
