import { context, Span, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('immich');

type TracedOptions = {
  name: string;
  kind?: SpanKind;
};

export function Traced(options: string | TracedOptions) {
  const { name: spanName, kind = SpanKind.INTERNAL } =
    typeof options === 'string' ? { name: options } : options;

  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return tracer.startActiveSpan(spanName, { kind }, context.active(), async (span: Span) => {
        try {
          const result = await originalMethod.apply(this, args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
          span.recordException(error as Error);
          throw error;
        } finally {
          span.end();
        }
      });
    };

    return descriptor;
  };
}
