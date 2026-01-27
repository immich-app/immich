import { context, metrics, Span, SpanKind, SpanStatusCode, trace, ValueType } from '@opentelemetry/api';
import type { CompiledQuery, DatabaseConnection, Driver, QueryResult, TransactionSettings } from 'kysely';

const dbTracer = trace.getTracer('immich-db');
const instrumentedConnections = new WeakSet<DatabaseConnection>();
const traceDbConnections = process.env.IMMICH_OTEL_TRACE_DB_CONNECTIONS === 'true';

let poolMetricsInitialized = false;

function initializePoolMetrics(maxConnections: number) {
  if (poolMetricsInitialized) {
    return;
  }
  poolMetricsInitialized = true;

  const meter = metrics.getMeter('immich-db');

  meter
    .createObservableGauge('db.client.connections.max', {
      description: 'Maximum number of connections in the pool',
      unit: '{connection}',
      valueType: ValueType.INT,
    })
    .addCallback((observable) => {
      observable.observe(maxConnections, { 'db.system': 'postgresql' });
    });
}

function getOperationName(sql: string): string {
  const trimmed = sql.trimStart().toUpperCase();
  if (trimmed.startsWith('SELECT')) {
    return 'SELECT';
  }
  if (trimmed.startsWith('INSERT')) {
    return 'INSERT';
  }
  if (trimmed.startsWith('UPDATE')) {
    return 'UPDATE';
  }
  if (trimmed.startsWith('DELETE')) {
    return 'DELETE';
  }
  if (trimmed.startsWith('WITH')) {
    return 'WITH';
  }
  if (trimmed.startsWith('BEGIN')) {
    return 'BEGIN';
  }
  if (trimmed.startsWith('COMMIT')) {
    return 'COMMIT';
  }
  if (trimmed.startsWith('ROLLBACK')) {
    return 'ROLLBACK';
  }
  return 'QUERY';
}

function getTableName(sql: string): string | undefined {
  const fromMatch = sql.match(/\bFROM\s+"?(\w+)"?/i);
  if (fromMatch) {
    return fromMatch[1];
  }

  const intoMatch = sql.match(/\bINTO\s+"?(\w+)"?/i);
  if (intoMatch) {
    return intoMatch[1];
  }

  const updateMatch = sql.match(/\bUPDATE\s+"?(\w+)"?/i);
  if (updateMatch) {
    return updateMatch[1];
  }

  return undefined;
}

function createInstrumentedConnection(
  connection: DatabaseConnection,
  transactionSpan?: Span,
): DatabaseConnection {
  if (instrumentedConnections.has(connection)) {
    return connection;
  }

  const instrumentedConnection: DatabaseConnection = {
    async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
      const sql = compiledQuery.sql;
      const operationName = getOperationName(sql);
      const tableName = getTableName(sql);
      const spanName = tableName ? `${operationName} ${tableName}` : operationName;

      const parentContext = transactionSpan
        ? trace.setSpan(context.active(), transactionSpan)
        : context.active();

      return dbTracer.startActiveSpan(spanName, { kind: SpanKind.CLIENT }, parentContext, async (span) => {
        try {
          span.setAttribute('db.system', 'postgresql');
          span.setAttribute('db.operation.name', operationName);
          span.setAttribute('db.query.text', sql);

          if (tableName) {
            span.setAttribute('db.collection.name', tableName);
          }

          if (compiledQuery.parameters.length > 0) {
            span.setAttribute('db.query.parameter_count', compiledQuery.parameters.length);
          }

          const result = await connection.executeQuery<R>(compiledQuery);

          span.setAttribute('db.response.row_count', result.rows.length);

          if (result.numAffectedRows !== undefined) {
            span.setAttribute('db.operation.affected_rows', Number(result.numAffectedRows));
          }

          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          if (error instanceof Error) {
            span.recordException(error);
          }
          throw error;
        } finally {
          span.end();
        }
      });
    },

    async *streamQuery<R>(
      compiledQuery: CompiledQuery,
      chunkSize: number,
    ): AsyncIterableIterator<QueryResult<R>> {
      const sql = compiledQuery.sql;
      const operationName = getOperationName(sql);
      const tableName = getTableName(sql);
      const spanName = tableName ? `STREAM ${operationName} ${tableName}` : `STREAM ${operationName}`;

      const parentContext = transactionSpan
        ? trace.setSpan(context.active(), transactionSpan)
        : context.active();

      const span = dbTracer.startSpan(spanName, { kind: SpanKind.CLIENT }, parentContext);

      span.setAttribute('db.system', 'postgresql');
      span.setAttribute('db.operation.name', operationName);
      span.setAttribute('db.query.text', sql);
      span.setAttribute('db.stream.chunk_size', chunkSize);

      if (tableName) {
        span.setAttribute('db.collection.name', tableName);
      }

      let totalRows = 0;
      let chunkCount = 0;

      try {
        for await (const chunk of connection.streamQuery<R>(compiledQuery, chunkSize)) {
          chunkCount++;
          totalRows += chunk.rows.length;
          yield chunk;
        }

        span.setAttribute('db.stream.chunk_count', chunkCount);
        span.setAttribute('db.stream.total_rows', totalRows);
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        if (error instanceof Error) {
          span.recordException(error);
        }
        throw error;
      } finally {
        span.end();
      }
    },
  };

  instrumentedConnections.add(instrumentedConnection);
  return instrumentedConnection;
}

const transactionSpans = new WeakMap<DatabaseConnection, Span>();
const unwrappedConnections = new WeakMap<DatabaseConnection, DatabaseConnection>();

/**
 * Creates an instrumented driver that wraps a Kysely driver with OpenTelemetry tracing.
 * Provides:
 * - Query spans with row counts and affected rows
 * - Streaming query spans with chunk metrics
 * - Transaction spans that parent query spans
 * - Connection acquisition timing
 */
export function createInstrumentedDriver(driver: Driver, maxConnections: number): Driver {
  initializePoolMetrics(maxConnections);

  return new Proxy(driver, {
    get(target, prop, receiver) {
      if (prop === 'init' || prop === 'destroy') {
        const method = Reflect.get(target, prop, target);
        if (typeof method === 'function') {
          return method.bind(target);
        }
        return method;
      }

      if (prop === 'acquireConnection') {
        return async function (): Promise<DatabaseConnection> {
          if (!traceDbConnections) {
            const connection = await target.acquireConnection();
            const instrumentedConnection = createInstrumentedConnection(connection);
            unwrappedConnections.set(instrumentedConnection, connection);
            return instrumentedConnection;
          }

          return dbTracer.startActiveSpan(
            'DB Connection Acquire',
            { kind: SpanKind.CLIENT },
            context.active(),
            async (span) => {
              try {
                span.setAttribute('db.system', 'postgresql');

                const connection = await target.acquireConnection();
                const instrumentedConnection = createInstrumentedConnection(connection);

                unwrappedConnections.set(instrumentedConnection, connection);

                span.setStatus({ code: SpanStatusCode.OK });
                return instrumentedConnection;
              } catch (error) {
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: error instanceof Error ? error.message : String(error),
                });
                if (error instanceof Error) {
                  span.recordException(error);
                }
                throw error;
              } finally {
                span.end();
              }
            },
          );
        };
      }

      if (prop === 'beginTransaction') {
        return async function (
          connection: DatabaseConnection,
          settings: TransactionSettings,
        ): Promise<void> {
          const unwrapped = unwrappedConnections.get(connection) ?? connection;

          const transactionSpan = dbTracer.startSpan(
            'DB Transaction',
            { kind: SpanKind.CLIENT },
            context.active(),
          );
          transactionSpan.setAttribute('db.system', 'postgresql');
          transactionSpan.setAttribute('db.operation.name', 'TRANSACTION');

          if (settings.isolationLevel) {
            transactionSpan.setAttribute('db.transaction.isolation_level', settings.isolationLevel);
          }

          transactionSpans.set(connection, transactionSpan);

          const instrumentedForTransaction = createInstrumentedConnection(unwrapped, transactionSpan);
          unwrappedConnections.set(instrumentedForTransaction, unwrapped);

          Object.assign(connection, instrumentedForTransaction);

          try {
            await target.beginTransaction(unwrapped, settings);
          } catch (error) {
            transactionSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof Error) {
              transactionSpan.recordException(error);
            }
            transactionSpan.end();
            transactionSpans.delete(connection);
            throw error;
          }
        };
      }

      if (prop === 'commitTransaction') {
        return async function (connection: DatabaseConnection): Promise<void> {
          const unwrapped = unwrappedConnections.get(connection) ?? connection;
          const transactionSpan = transactionSpans.get(connection);

          try {
            await target.commitTransaction(unwrapped);
            transactionSpan?.setStatus({ code: SpanStatusCode.OK });
          } catch (error) {
            transactionSpan?.setStatus({
              code: SpanStatusCode.ERROR,
              message: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof Error) {
              transactionSpan?.recordException(error);
            }
            throw error;
          } finally {
            transactionSpan?.end();
            transactionSpans.delete(connection);
          }
        };
      }

      if (prop === 'rollbackTransaction') {
        return async function (connection: DatabaseConnection): Promise<void> {
          const unwrapped = unwrappedConnections.get(connection) ?? connection;
          const transactionSpan = transactionSpans.get(connection);

          try {
            await target.rollbackTransaction(unwrapped);
            transactionSpan?.setAttribute('db.transaction.rollback', true);
            transactionSpan?.setStatus({ code: SpanStatusCode.OK });
          } catch (error) {
            transactionSpan?.setStatus({
              code: SpanStatusCode.ERROR,
              message: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof Error) {
              transactionSpan?.recordException(error);
            }
            throw error;
          } finally {
            transactionSpan?.end();
            transactionSpans.delete(connection);
          }
        };
      }

      if (prop === 'releaseConnection') {
        return async function (connection: DatabaseConnection): Promise<void> {
          const unwrapped = unwrappedConnections.get(connection) ?? connection;
          unwrappedConnections.delete(connection);
          transactionSpans.delete(connection);
          return target.releaseConnection(unwrapped);
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  });
}
