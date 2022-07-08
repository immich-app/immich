import { PipeTransform } from '../../interfaces/index';
/**
 * Decorator that binds pipes to the scope of the controller or method,
 * depending on its context.
 *
 * When `@UsePipes` is used at the controller level, the pipe will be
 * applied to every handler (method) in the controller.
 *
 * When `@UsePipes` is used at the individual handler level, the pipe
 * will apply only to that specific method.
 *
 * @param pipes a single pipe instance or class, or a list of pipe instances or
 * classes.
 *
 * @see [Pipes](https://docs.nestjs.com/pipes)
 *
 * @usageNotes
 * Pipes can also be set up globally for all controllers and routes
 * using `app.useGlobalPipes()`.  [See here for details](https://docs.nestjs.com/pipes#class-validator)
 *
 * @publicApi
 */
export declare function UsePipes(...pipes: (PipeTransform | Function)[]): ClassDecorator & MethodDecorator;
