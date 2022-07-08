"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Render = void 0;
const constants_1 = require("../../constants");
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
function Render(template) {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(constants_1.RENDER_METADATA, template, descriptor.value);
        return descriptor;
    };
}
exports.Render = Render;
