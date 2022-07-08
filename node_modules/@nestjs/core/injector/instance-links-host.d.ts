import { NestContainer } from './container';
import { InstanceWrapper } from './instance-wrapper';
import { InstanceToken } from './module';
export interface InstanceLink<T = any> {
    token: InstanceToken;
    wrapperRef: InstanceWrapper<T>;
    collection: Map<any, InstanceWrapper>;
    moduleId: string;
}
export declare class InstanceLinksHost {
    private readonly container;
    private readonly instanceLinks;
    constructor(container: NestContainer);
    get<T = any>(token: InstanceToken, moduleId?: string): InstanceLink<T>;
    private initialize;
    private addLink;
    private getInstanceNameByToken;
}
