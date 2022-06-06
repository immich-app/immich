"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    await app.listen(3000, () => {
        if (process.env.NODE_ENV == 'development') {
            common_1.Logger.log('Running Immich Microservices in DEVELOPMENT environment', 'IMMICH MICROSERVICES');
        }
        if (process.env.NODE_ENV == 'production') {
            common_1.Logger.log('Running Immich Microservices in PRODUCTION environment', 'IMMICH MICROSERVICES');
        }
    });
}
bootstrap();
//# sourceMappingURL=main.js.map