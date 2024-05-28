export const IMapRepository = 'IMapRepository';

export interface IMapRepository {
  fetchStyle(url: string): Promise<any>;
}
