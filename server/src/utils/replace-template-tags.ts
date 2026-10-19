import { escape } from 'lodash-es';

export const replaceTemplateTags = (
  template: string,
  variables: Record<string, string | undefined>,
  { escapeHtml = true } = {},
) => {
  return template.replaceAll(/{(.*?)}/g, (_, key) => {
    const value = variables[key];
    if (!value) {
      return `{${key}}`;
    }
    return escapeHtml ? escape(value) : value;
  });
};

export const templatePreview = (template: string, variables: Record<string, string | undefined>) => {
  return replaceTemplateTags(template, variables, { escapeHtml: false }).replaceAll(/<[^>]*>/g, '');
};
