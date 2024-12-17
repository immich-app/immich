import { dump as dumpYaml } from 'js-yaml';
import {
  Command,
  ComposeSpecification,
  DefinitionsService,
  DefinitionsVolume,
  ListOfStrings,
} from 'lib/docker-compose/types';

type ServiceNameAccessor = { getName: () => string };
type ServiceBuildAccessor = { build: () => DefinitionsService };

const withNewLines = (yaml: string) =>
  yaml.replaceAll(/(?<leading>[^:]\n)(?<key>[ ]{0,2}\S+:)$/gm, '$<leading>\n$<key>');

export class ComposeBuilder {
  private spec: ComposeSpecification = {};
  private comments: string[] = [];

  private constructor(projectName?: string) {
    if (projectName) {
      this.setProjectName(projectName);
    }
  }

  static create(projectName?: string) {
    return new ComposeBuilder(projectName);
  }

  setProjectName(name: string) {
    this.spec.name = name;
    return this;
  }

  addComment(comment: string) {
    this.comments.push(comment + '\n');

    return this;
  }

  addService(spec: false | (ServiceNameAccessor & ServiceBuildAccessor)) {
    if (!spec) {
      return this;
    }

    if (!this.spec.services) {
      this.spec.services = {};
    }

    this.spec.services[spec.getName()] = spec.build();

    return this;
  }

  addVolume(name: string, volume: false | DefinitionsVolume) {
    if (volume === false) {
      return this;
    }

    if (!this.spec.volumes) {
      this.spec.volumes = {};
    }

    this.spec.volumes[name] = volume;

    return this;
  }

  asSpec() {
    return this.spec;
  }

  asYaml() {
    let prefix = '';
    if (this.comments.length > 0) {
      const comments =
        this.comments
          .flatMap((comment) => comment.split('\n'))
          .join('\n')
          .trim()
          .split('\n')
          .map((comment) => `# ${comment}`)
          .join('\n') + '\n\n';

      prefix += comments;
    }

    const spec = withNewLines(dumpYaml(this.spec, { indent: 2, lineWidth: 140 })).trim();

    return prefix + spec;
  }
}

export class ServiceBuilder {
  private spec: DefinitionsService = {};

  private constructor(private name: string) {}

  static create(name: string) {
    return new ServiceBuilder(name);
  }

  getName() {
    return this.name;
  }

  setImage(image: string) {
    this.spec.image = image;
    return this;
  }

  setContainerName(name: false | string) {
    if (name === false) {
      return this;
    }

    this.spec.container_name = name;

    return this;
  }

  addExposedPort(port: number | { internal: number; external: number }) {
    if (typeof port === 'number') {
      port = { internal: port, external: port };
    }

    const { internal, external } = port;

    if (!this.spec.ports) {
      this.spec.ports = [];
    }

    this.spec.ports.push(`${external}:${internal}`);

    return this;
  }

  addDependsOn(service: false | string | ServiceNameAccessor) {
    if (service === false) {
      return this;
    }

    let serviceName = service as string;
    if ('getName' in (service as ServiceNameAccessor)) {
      serviceName = (service as ServiceNameAccessor).getName();
    }

    if (!this.spec.depends_on) {
      this.spec.depends_on = [];
    }

    (this.spec.depends_on as ListOfStrings).push(serviceName);

    return this;
  }

  setRestartPolicy(restart: string) {
    this.spec.restart = restart;
    return this;
  }

  setEnvironment(env: Record<string, string | number | undefined>) {
    this.spec.environment = env;

    return this;
  }

  setHealthcheck(test: boolean | string) {
    if (test === true) {
      return this;
    }

    if (test === false) {
      this.spec.healthcheck = { disable: true };
      return this;
    }

    this.spec.healthcheck = { test };
    return this;
  }

  setCommand(command: Command) {
    this.spec.command = command;

    return this;
  }

  addVolume(volume: string) {
    if (!this.spec.volumes) {
      this.spec.volumes = [];
    }
    this.spec.volumes.push(volume);

    return this;
  }

  addVolumes(volumes: string[]) {
    for (const volume of volumes) {
      this.addVolume(volume);
    }

    return this;
  }

  build() {
    return this.spec;
  }
}
