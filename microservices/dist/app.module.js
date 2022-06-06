"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const thumbnail_processor_1 = require("./services/thumbnail/thumbnail.processor");
const typeorm_1 = require("@nestjs/typeorm");
const database_config_1 = require("./config/database.config");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot(database_config_1.databaseConfig),
            bull_1.BullModule.forRootAsync({
                useFactory: async () => ({
                    redis: {
                        host: process.env.REDIS_HOSTNAME || 'immich_redis',
                        port: 6379,
                    },
                }),
            }),
            bull_1.BullModule.registerQueue({
                name: 'thumbnail-queue',
                defaultJobOptions: {
                    attempts: 3,
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            }),
        ],
        controllers: [],
        providers: [thumbnail_processor_1.ThumbnailProcessor],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map