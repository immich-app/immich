import { Scope } from '../scope-options.interface';
/**
 * @publicApi
 */
export interface IntrospectionResult {
    /**
     * Enum defining lifetime of host class or factory.
     */
    scope: Scope;
}
