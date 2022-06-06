"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
exports.databaseConfig = {
    type: 'postgres',
    host: process.env.DB_HOSTNAME || 'immich_postgres',
    port: 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_NAME,
};
//# sourceMappingURL=database.config.js.map