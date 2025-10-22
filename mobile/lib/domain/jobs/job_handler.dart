import 'dart:async';
import 'dart:collection';

import 'package:cancellation_token_http/http.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/jobs/job_context.dart';
import 'package:immich_mobile/extensions/completer_extensions.dart';
import 'package:logging/logging.dart';

abstract class JobHandler<Input> {
  late final Logger logger;
  final JobContext context;

  final Queue<String> _jobQueue = Queue();
  final Map<String, _JobState<Input>> _jobs = {};
  int get runningCount => _jobs.values.where((s) => s.isRunning).length;
  bool _isProcessing = false;

  JobHandler({required this.context}) {
    logger = Logger(context.id);
  }

  // ═══════════════════════════════════════════════════════════
  // ABSTRACT METHODS / FIELDS - Concrete implementations override these
  // ═══════════════════════════════════════════════════════════

  Future<void> processJob(String jobId, Input input, CancellationToken token);

  int get maxConcurrentJobs => 1;

  Duration get cancellationTimeout => const Duration(seconds: 1);

  bool shouldSkipInput(Input newInput, Input existingInput) => false;

  // ═══════════════════════════════════════════════════════════
  // CONCRETE METHODS
  // ═══════════════════════════════════════════════════════════

  @mustCallSuper
  void queue(String jobId, Input input) async {
    if (_shouldSkipInput(input)) {
      context.reportJobSkipped(jobId: jobId);
      return;
    }

    final token = CancellationToken();
    _jobs[jobId] = _JobState(jobId: jobId, input: input, token: token, completer: Completer<void>(), isRunning: false);
    _jobQueue.add(jobId);
    _processQueue();
  }

  bool _shouldSkipInput(Input input) {
    for (final job in _jobs.values) {
      if (shouldSkipInput(input, job.input)) {
        return true;
      }
    }

    return false;
  }

  Future<void> _processQueue() async {
    if (_isProcessing) {
      return;
    }
    _isProcessing = true;

    while (_jobQueue.isNotEmpty && runningCount < maxConcurrentJobs) {
      final jobId = _jobQueue.removeFirst();
      final jobState = _jobs[jobId];

      if (jobState == null) {
        logger.warning('Job state not found for jobId: $jobId');
        continue;
      }

      if (jobState.token.isCancelled) {
        context.reportJobCancelled(jobId: jobId);
        jobState.completer.completeOnce();
        _jobs.remove(jobId);
        continue;
      }

      jobState.isRunning = true;

      _runJob(jobState).then((_) {
        _jobs[jobId]?.completer.completeOnce();
        _jobs.remove(jobId);
        _processQueue();
      });
    }
    _isProcessing = false;
  }

  Future<void> _runJob(_JobState<Input> job) async {
    try {
      await processJob(job.jobId, job.input, job.token);

      if (!job.token.isCancelled) {
        context.reportJobComplete(jobId: job.jobId);
      }
    } on CancelledException {
      context.reportJobCancelled(jobId: job.jobId);
    } catch (e, stack) {
      context.reportJobError(jobId: job.jobId, error: '$e', stackTrace: stack.toString());
    }
  }

  @mustCallSuper
  Future<void> cancel(String jobId) async {
    final jobState = _jobs[jobId];
    if (jobState == null) return;

    jobState.token.cancel();

    if (!jobState.isRunning) {
      _jobQueue.removeWhere((id) => id == jobId);
    }

    await jobState.completer.future.timeout(cancellationTimeout, onTimeout: () {});
  }

  @mustCallSuper
  Future<void> cancelAll() async {
    for (final state in _jobs.values) {
      state.token.cancel();
    }

    _jobQueue.clear();

    if (_jobs.isNotEmpty) {
      await Future.wait(_jobs.values.map((s) => s.completer.future)).timeout(
        cancellationTimeout * 2,
        onTimeout: () {
          return [];
        },
      );
    }
  }

  @mustCallSuper
  Future<void> shutdown() async {
    await cancelAll();
  }
}

class _JobState<Input> {
  final String jobId;
  final Input input;
  final CancellationToken token;
  final Completer<void> completer;
  bool isRunning;

  _JobState({
    required this.jobId,
    required this.input,
    required this.token,
    required this.completer,
    this.isRunning = false,
  });
}
