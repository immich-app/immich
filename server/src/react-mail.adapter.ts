import React from 'react';
import { render } from '@react-email/render';
import {TemplateAdapter, TemplateAdapterOptions} from "./interfaces/mail.interface";

export class ReactMailAdapter implements TemplateAdapter {
  private templateRegistry = new Map<string, React.FunctionComponent<any>>();
  constructor() {}

  registerTemplate(slug: string, templateComponent: React.FunctionComponent<any>): void {
    this.templateRegistry.set(slug, templateComponent);
  }

  compile(mail: any, callback: (err?: any, body?: string) => any, options: TemplateAdapterOptions): void {
    try {
      const { plainText = false, ...otherOptions } = options.template?.options ?? {};
      const template = this.templateRegistry.get(mail.data.template);

      if (!template) {
        throw new Error('Template Not found!');
      }

      const component = React.createElement(template, mail.data.context);
      mail.data.html = render(component, otherOptions);
      if (plainText) {
        mail.data.text = render(component, {
          ...otherOptions,
          plainText,
        });
      }

      return callback();
    } catch (err) {
      console.error(err);
      callback(err);
    }
  }
}
