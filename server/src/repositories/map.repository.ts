import { Injectable } from '@nestjs/common';
import { IMapRepository } from 'src/interfaces/map.interface';
import { Instrumentation } from 'src/utils/instrumentation';

@Instrumentation()
@Injectable()
export class MapRepository implements IMapRepository {
  async fetchStyle(url: string) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url} with status ${response.status}: ${await response.text()}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(`Failed to fetch data from ${url}: ${error}`);
    }
  }
}
