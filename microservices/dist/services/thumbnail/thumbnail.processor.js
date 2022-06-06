"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThumbnailProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const typeorm_1 = require("typeorm");
let ThumbnailProcessor = class ThumbnailProcessor {
    constructor(entityManager) {
        this.entityManager = entityManager;
    }
    async generateThumbnail(job) {
    }
    async generateWebpThumbnail(job) {
        console.log("Run Generate Thumbnail Job 12", job.data);
    }
};
__decorate([
    (0, bull_1.Process)('generate-thumbnail'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ThumbnailProcessor.prototype, "generateThumbnail", null);
__decorate([
    (0, bull_1.Process)('generate-webp-thumbnail'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ThumbnailProcessor.prototype, "generateWebpThumbnail", null);
ThumbnailProcessor = __decorate([
    (0, bull_1.Processor)('thumbnail-queue'),
    __metadata("design:paramtypes", [typeorm_1.EntityManager])
], ThumbnailProcessor);
exports.ThumbnailProcessor = ThumbnailProcessor;
//# sourceMappingURL=thumbnail.processor.js.map