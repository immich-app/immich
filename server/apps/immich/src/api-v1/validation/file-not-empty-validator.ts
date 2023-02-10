import { FileValidator, Injectable } from '@nestjs/common';

@Injectable()
export default class FileNotEmptyValidator extends FileValidator {
  requiredFields: string[];

  constructor(requiredFields: string[]) {
    super({});
    this.requiredFields = requiredFields;
  }

  isValid(files?: any): boolean {
    if (!files) {
      return false;
    }

    return this.requiredFields.every((field) => {
      return files[field];
    });
  }

  buildErrorMessage(): string {
    return `Field(s) ${this.requiredFields.join(', ')} should not be empty`;
  }
}
