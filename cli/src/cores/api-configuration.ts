export class ApiConfiguration {
  public readonly instanceUrl!: string;
  public readonly apiKey!: string;

  constructor(instanceUrl: string, apiKey: string) {
    this.instanceUrl = instanceUrl;
    this.apiKey = apiKey;
  }
}
