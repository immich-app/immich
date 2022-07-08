import { ArgumentMetadata, PipeTransform } from '@nestjs/common/interfaces';
export declare class PipesConsumer {
    private readonly paramsTokenFactory;
    apply<TInput = unknown>(value: TInput, { metatype, type, data }: ArgumentMetadata, pipes: PipeTransform[]): Promise<TInput>;
    applyPipes<TInput = unknown>(value: TInput, { metatype, type, data }: {
        metatype: any;
        type?: any;
        data?: any;
    }, transforms: PipeTransform[]): Promise<TInput>;
}
