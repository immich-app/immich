import 'dart:isolate';

sealed class IsolateRequest {
  const IsolateRequest();
}

class JobTriggerRequest<Input> extends IsolateRequest {
  final String jobId;
  final Input? input;

  const JobTriggerRequest({required this.jobId, this.input});
}

class JobCancelRequest extends IsolateRequest {
  final String jobId;

  const JobCancelRequest({required this.jobId});
}

class IsolateCancelAllRequest extends IsolateRequest {
  const IsolateCancelAllRequest();
}

class IsolateShutdownRequest extends IsolateRequest {
  const IsolateShutdownRequest();
}

sealed class IsolateResponse {
  const IsolateResponse();
}

class IsolateReadyResponse extends IsolateResponse {
  final SendPort requestPort;

  const IsolateReadyResponse(this.requestPort);
}

class JobProgressResponse extends IsolateResponse {
  final String jobId;
  final double? progress;
  final int? current;
  final int? total;

  const JobProgressResponse({required this.jobId, this.progress, this.current, this.total});
}

class JobCompleteResponse<Output> extends IsolateResponse {
  final String jobId;
  final Output? result;

  const JobCompleteResponse({required this.jobId, this.result});
}

class JobErrorResponse extends IsolateResponse {
  final String jobId;
  final String error;
  final String? stackTrace;

  const JobErrorResponse({required this.jobId, required this.error, this.stackTrace});
}

class JobCancelledResponse extends IsolateResponse {
  final String jobId;

  const JobCancelledResponse({required this.jobId});
}

class JobSkippedResponse extends IsolateResponse {
  final String jobId;

  const JobSkippedResponse({required this.jobId});
}

class IsolateErrorResponse extends IsolateResponse {
  final String error;
  final String? stackTrace;

  const IsolateErrorResponse({required this.error, this.stackTrace});
}
