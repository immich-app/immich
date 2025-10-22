part of 'job.dart';

typedef _IsolateStartMessage = ({RootIsolateToken token, JobType type, SendPort mainPort});

Future<void> _isolateEntryPoint(_IsolateStartMessage message) async {
  final _IsolateStartMessage(:token, :mainPort, :type) = message;

  final logger = Logger(type.id);
  final isolateCompleter = Completer<void>();

  try {
    BackgroundIsolateBinaryMessenger.ensureInitialized(token);
    DartPluginRegistrant.ensureInitialized();

    final (isar, drift, logDb) = await Bootstrap.initDB();
    await Bootstrap.initDomain(isar, drift, logDb, shouldBufferLogs: false, listenStoreUpdates: false);

    final container = ProviderContainer(
      overrides: [
        dbProvider.overrideWithValue(isar),
        isarProvider.overrideWithValue(isar),
        driftProvider.overrideWith(driftOverride(drift)),
      ],
    );

    final context = JobContext(id: type.id, ref: container, mainPort: mainPort);
    final receivePort = ReceivePort();
    mainPort.send(IsolateReadyResponse(receivePort.sendPort));

    final handler = getJobHandler(type, context);

    receivePort.listen((message) async {
      try {
        switch (message) {
          case JobTriggerRequest msg:
            handler.queue(msg.jobId, msg.input);

          case JobCancelRequest msg:
            await handler.cancel(msg.jobId);

          case IsolateCancelAllRequest _:
            await handler.cancelAll();

          case IsolateShutdownRequest _:
            receivePort.close();
            await handler.shutdown();
            await _cleanup(container, isar, drift, logDb);
            isolateCompleter.completeOnce();
        }
      } catch (e, stack) {
        logger.severe('Error handling command', e, stack);
        context.reportIsolateError(error: 'Command error: $e', stackTrace: stack.toString());
      }
    });
  } catch (e, stack) {
    logger.severe('Job fatal error', e, stack);
    mainPort.send(IsolateErrorResponse(error: 'Job crashed: $e', stackTrace: stack.toString()));
    isolateCompleter.completeOnce();
  }
  await isolateCompleter.future;
}

Future<void> _cleanup(ProviderContainer container, Isar isar, Drift drift, DriftLogger logDb) async {
  try {
    container.dispose();
    await Store.dispose();
    await LogService.I.dispose();
    await logDb.close();
    await drift.close();
    if (isar.isOpen) {
      await isar.close();
    }
  } catch (error, stack) {
    dPrint(() => 'Job Cleanup error: $error, stack: $stack');
  }
}
