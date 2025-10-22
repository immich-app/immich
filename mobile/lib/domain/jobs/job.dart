import 'dart:async';
import 'dart:isolate';
import 'dart:ui';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/jobs/job_context.dart';
import 'package:immich_mobile/domain/jobs/job_messages.dart';
import 'package:immich_mobile/domain/jobs/job_status.dart';
import 'package:immich_mobile/domain/jobs/job_types.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/completer_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';

part 'job_entrypoint.dart';

final _jobLogger = Logger('Job');

abstract class Job<Input, Output> {
  Isolate? _isolate;
  SendPort? _jobPort;
  ReceivePort? _receivePort;
  final Map<String, StreamController<JobProgress<Output>>> _jobProgressControllers = {};
  bool get isRunning => _isolate != null;

  // ═══════════════════════════════════════════════════════════
  // ABSTRACT METHODS / FIELDS - Concrete implementations override these
  // ═══════════════════════════════════════════════════════════

  JobType get type;

  Duration get idleInterval;
  Future<void> onIdle();

  Duration get shutdownTimeout => const Duration(seconds: 5);

  // ═══════════════════════════════════════════════════════════
  // CONCRETE METHODS
  // ═══════════════════════════════════════════════════════════

  Timer? _idleTimer;

  void _resetIdleTimer() {
    _idleTimer?.cancel();
    _idleTimer = Timer.periodic(idleInterval, (_) async {
      await onIdle();
    });
  }

  void _cancelIdleTimer() {
    _idleTimer?.cancel();
    _idleTimer = null;
  }

  Future<void> start() async {
    if (_isolate != null) return;

    final rootToken = RootIsolateToken.instance;
    if (rootToken == null) {
      throw StateError('RootIsolateToken is not available. Ensure that the job is started from the main isolate.');
    }

    _receivePort = ReceivePort();
    _receivePort!.listen(_handleMessage);

    _isolate = await Isolate.spawn(_isolateEntryPoint, (
      type: type,
      token: rootToken,
      mainPort: _receivePort!.sendPort,
    ), debugName: type.id);

    _resetIdleTimer();
  }

  String trigger(Input input) {
    if (_jobPort == null) {
      throw StateError('Job not started. Call start() before triggering jobs.');
    }

    final jobId = _generateJobId();
    _jobPort!.send(JobTriggerRequest<Input>(jobId: jobId, input: input));
    _jobProgressControllers[jobId] = StreamController<JobProgress<Output>>.broadcast();
    _resetIdleTimer();
    return jobId;
  }

  Future<Output?> run(Input input) async {
    if (_jobPort == null) {
      throw StateError('Job not started. Call start() before running jobs.');
    }

    final jobId = _generateJobId();
    _jobPort!.send(JobTriggerRequest<Input>(jobId: jobId, input: input));
    _jobProgressControllers[jobId] = StreamController<JobProgress<Output>>.broadcast();
    _resetIdleTimer();
    final progress = await waitFor(jobId);
    return progress.result;
  }

  int _jobCounter = 0;
  String _generateJobId() => '${type.id}_${DateTime.now().millisecondsSinceEpoch}_${_jobCounter++}';

  void cancel({required String jobId}) {
    if (_jobPort == null) {
      throw StateError('Job not started. Call start() before cancelling jobs.');
    }

    _jobPort!.send(JobCancelRequest(jobId: jobId));
  }

  void cancelAll() {
    if (_jobPort == null) {
      throw StateError('Job not started. Call start() before cancelling jobs.');
    }

    _cancelIdleTimer();
    _jobPort!.send(const IsolateCancelAllRequest());
  }

  Stream<JobProgress> watch(String jobId) {
    if (!_jobProgressControllers.containsKey(jobId)) {
      throw StateError('No job found with ID: $jobId. Trigger the job before watching its progress.');
    }

    return _jobProgressControllers[jobId]!.stream;
  }

  Future<JobProgress> waitFor(String jobId) {
    return watch(jobId).firstWhere((p) => p.isComplete || p.isError || p.isCancelled);
  }

  Future<void> stop() async {
    if (_isolate == null) return;

    _cancelIdleTimer();

    if (_jobPort == null) {
      _jobLogger.warning('Job isolate is running but job port is null for type: $this.id.');
    }

    final jobPort = _jobPort;
    final isolate = _isolate;
    _jobPort = null;
    _isolate = null;

    jobPort?.send(const IsolateShutdownRequest());

    // Wait for all jobs to complete before killing the isolate
    if (_jobProgressControllers.isNotEmpty) {
      await Future.wait(_jobProgressControllers.keys.map((id) => waitFor(id))).timeout(
        shutdownTimeout,
        onTimeout: () {
          _jobLogger.warning(
            'Timeout waiting for jobs to complete during shutdown of job type: $this.id. Force killing isolate.',
          );
          return <JobProgress>[];
        },
      );
    }

    isolate?.kill(priority: Isolate.immediate);
    _receivePort?.close();
    _receivePort = null;

    for (final controller in _jobProgressControllers.values) {
      await controller.close();
    }
    _jobProgressControllers.clear();
  }

  void _handleMessage(dynamic message) {
    switch (message) {
      case IsolateReadyResponse msg:
        _jobPort = msg.requestPort;

      case JobProgressResponse msg:
        final progress = JobProgress<Output>.running(progress: msg.progress, current: msg.current, total: msg.total);
        _addJobProgress(msg.jobId, progress, close: false);

      case JobCompleteResponse msg:
        final progress = JobProgress<Output>.completed(result: msg.result);
        _addJobProgress(msg.jobId, progress);

      case JobErrorResponse msg:
        final progress = JobProgress<Output>.error(msg.error);
        _addJobProgress(msg.jobId, progress);

      case JobCancelledResponse msg:
        final progress = JobProgress<Output>.cancelled();
        _addJobProgress(msg.jobId, progress);

      case JobSkippedResponse msg:
        final progress = JobProgress<Output>.skipped();
        _addJobProgress(msg.jobId, progress);

      case IsolateErrorResponse msg:
        _jobLogger.severe('Isolate error: ${msg.error}\nStackTrace: ${msg.stackTrace}');
    }
  }

  void _addJobProgress(String jobId, JobProgress<Output> progress, {bool close = true}) {
    final controller = _jobProgressControllers[jobId];
    if (controller == null) {
      _jobLogger.warning('Received progress update for unknown job: $jobId');
      return;
    }

    controller.add(progress);

    if (close) {
      controller.close();
      _jobProgressControllers.remove(jobId);
    }
  }
}
