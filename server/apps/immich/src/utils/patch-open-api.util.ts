import { OpenAPIObject } from '@nestjs/swagger';

export function patchOpenAPI(document: OpenAPIObject) {
  for (const path of Object.values(document.paths)) {
    const operations = {
      get: path.get,
      put: path.put,
      post: path.post,
      delete: path.delete,
      options: path.options,
      head: path.head,
      patch: path.patch,
      trace: path.trace,
    };

    for (const operation of Object.values(operations)) {
      if (!operation) {
        continue;
      }

      if (operation.summary === '') {
        delete operation.summary;
      }

      if (operation.description === '') {
        delete operation.description;
      }
    }
  }

  return document;
}
