import 'dart:isolate';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/jobs/job_messages.dart';

class JobContext {
  final String id;
  final ProviderContainer ref;
  final SendPort _mainPort;

  const JobContext({required this.id, required this.ref, required SendPort mainPort}) : _mainPort = mainPort;

  ProviderResult read<ProviderResult>(ProviderListenable<ProviderResult> provider) => provider.read(ref);

  void reportJobProgress({required String jobId, double? progress, int? current, int? total}) {
    _mainPort.send(JobProgressResponse(jobId: jobId, progress: progress, current: current, total: total));
  }

  void reportJobComplete<Result>({required String jobId, Result? result}) {
    _mainPort.send(JobCompleteResponse(jobId: jobId, result: result));
  }

  void reportJobError({required String jobId, required String error, String? stackTrace}) {
    _mainPort.send(JobErrorResponse(jobId: jobId, error: error, stackTrace: stackTrace));
  }

  void reportIsolateError({required String error, String? stackTrace}) {
    _mainPort.send(IsolateErrorResponse(error: error, stackTrace: stackTrace));
  }

  void reportJobCancelled({required String jobId}) {
    _mainPort.send(JobCancelledResponse(jobId: jobId));
  }

  void reportJobSkipped({required String jobId}) {
    _mainPort.send(JobSkippedResponse(jobId: jobId));
  }
}
