import { RequestMethod } from '@nestjs/common';
export interface ExcludeRouteMetadata {
    /**
     * Regular expression representing the route path.
     */
    pathRegex: RegExp;
    /**
     * HTTP request method (e.g., GET, POST).
     */
    requestMethod: RequestMethod;
}
