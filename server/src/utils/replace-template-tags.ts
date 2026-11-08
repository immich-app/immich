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
  let text = replaceTemplateTags(template, variables, { escapeHtml: false });
  let previous: string;
  do {
    previous = text;
    text = text.replaceAll(/<[^>]*>/g, '');
  } while (text !== previous);
  return text;
};

export const templateText = (template: string, variables: Record<string, string | undefined>) => {
  return replaceTemplateTags(template, variables)
    .replaceAll(/<(head|style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replaceAll(/<br\s*\/?>/gi, '\n')
    .replaceAll(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll(/&nbsp;/g, ' ')
    .replaceAll(/&amp;/g, '&')
    .replaceAll(/&lt;/g, '<')
    .replaceAll(/&gt;/g, '>')
    .replaceAll(/&quot;/g, '"')
    .replaceAll(/&#39;/g, "'")
    .trim();
};
