import { MiddlewareConsumer } from '../middleware/middleware-consumer.interface';
export interface NestModule {
    configure(consumer: MiddlewareConsumer): any;
}
