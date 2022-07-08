/**
 * Route handler method Decorator.  Defines a template to be rendered by the controller.
 *
 * For example: `@Render('index')`
 *
 * @param template name of the render engine template file
 *
 * @see [Model-View-Controller](https://docs.nestjs.com/techniques/mvc)
 *
 * @publicApi
 */
export declare function Render(template: string): MethodDecorator;
