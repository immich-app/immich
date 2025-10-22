enum JobStatus { running, completed, error, cancelled, skipped }

class JobProgress<T> {
  final JobStatus status;

  // JobStatus.completed
  final T? result;

  // JobStatus.running
  final double? progress;
  final int? current;
  final int? total;

  // JobStatus.error
  final String? error;

  const JobProgress({required this.status, this.result, this.progress, this.current, this.total, this.error});

  bool get isRunning => status == JobStatus.running;
  bool get isComplete => status == JobStatus.completed;
  bool get isError => status == JobStatus.error;
  bool get isCancelled => status == JobStatus.cancelled;

  factory JobProgress.running({double? progress, int? current, int? total}) {
    assert(progress == null || (progress >= 0 && progress <= 1), 'Progress must be 0-1');
    assert(current == null || total == null || current <= total, 'Current must be <= total');
    return JobProgress(status: JobStatus.running, progress: progress, current: current, total: total);
  }

  factory JobProgress.completed({T? result}) => JobProgress(status: JobStatus.completed, result: result);

  factory JobProgress.error(String error) => JobProgress(status: JobStatus.error, error: error);

  factory JobProgress.cancelled() => const JobProgress(status: JobStatus.cancelled);

  factory JobProgress.skipped() => const JobProgress(status: JobStatus.skipped);

  @override
  String toString() => switch (status) {
    JobStatus.running => 'JobProgress(running: progress=$progress, current=$current, total=$total)',
    JobStatus.completed => 'JobProgress(completed: result=$result)',
    JobStatus.error => 'JobProgress(error: error=$error)',
    JobStatus.cancelled => 'JobProgress(cancelled)',
    JobStatus.skipped => 'JobProgress(skipped)',
  };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is JobProgress<T> &&
          runtimeType == other.runtimeType &&
          status == other.status &&
          result == other.result &&
          progress == other.progress &&
          current == other.current &&
          total == other.total &&
          error == other.error;

  @override
  int get hashCode =>
      status.hashCode ^ result.hashCode ^ progress.hashCode ^ current.hashCode ^ total.hashCode ^ error.hashCode;
}
