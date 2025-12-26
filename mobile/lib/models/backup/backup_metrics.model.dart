/// Performance metrics collected per backup batch for adaptive throttling.
/// 
/// These metrics are used by the AdaptiveThrottleController to determine
/// whether to speed up, slow down, or maintain current backup parameters.
class BackupBatchMetrics {
  /// Number of assets successfully uploaded in this batch
  final int successCount;

  /// Number of assets that failed to upload in this batch
  final int failureCount;

  /// Total time taken to process this batch in milliseconds
  final int batchDurationMs;

  /// Number of timeout errors encountered
  final int timeoutErrors;

  /// Number of network errors encountered
  final int networkErrors;

  /// Number of server errors (5xx) encountered
  final int serverErrors;

  /// Number of file/permission errors encountered
  final int fileErrors;

  /// Memory usage at start of batch (bytes, if available)
  final int? memoryAtStart;

  /// Memory usage at end of batch (bytes, if available)
  final int? memoryAtEnd;

  /// Timestamp when this batch started
  final DateTime startTime;

  /// Timestamp when this batch completed
  final DateTime endTime;

  const BackupBatchMetrics({
    required this.successCount,
    required this.failureCount,
    required this.batchDurationMs,
    required this.timeoutErrors,
    required this.networkErrors,
    required this.serverErrors,
    required this.fileErrors,
    this.memoryAtStart,
    this.memoryAtEnd,
    required this.startTime,
    required this.endTime,
  });

  /// Total number of assets attempted in this batch
  int get totalAttempted => successCount + failureCount;

  /// Success rate as a decimal (0.0 to 1.0)
  double get successRate => totalAttempted > 0 ? successCount / totalAttempted : 1.0;

  /// Average time per asset in milliseconds
  double get avgTimePerAssetMs => totalAttempted > 0 ? batchDurationMs / totalAttempted : 0;

  /// Whether any timeout errors occurred
  bool get hasTimeouts => timeoutErrors > 0;

  /// Whether any network errors occurred
  bool get hasNetworkErrors => networkErrors > 0;

  /// Whether any server errors occurred
  bool get hasServerErrors => serverErrors > 0;

  /// Total error count
  int get totalErrors => timeoutErrors + networkErrors + serverErrors + fileErrors;

  /// Memory delta (positive means memory increased)
  int? get memoryDelta {
    if (memoryAtStart != null && memoryAtEnd != null) {
      return memoryAtEnd! - memoryAtStart!;
    }
    return null;
  }

  /// Creates an empty metrics object for initialization
  factory BackupBatchMetrics.empty() {
    final now = DateTime.now();
    return BackupBatchMetrics(
      successCount: 0,
      failureCount: 0,
      batchDurationMs: 0,
      timeoutErrors: 0,
      networkErrors: 0,
      serverErrors: 0,
      fileErrors: 0,
      startTime: now,
      endTime: now,
    );
  }

  /// Creates metrics from batch processing results
  factory BackupBatchMetrics.fromBatch({
    required int successCount,
    required int failureCount,
    required DateTime startTime,
    required DateTime endTime,
    int timeoutErrors = 0,
    int networkErrors = 0,
    int serverErrors = 0,
    int fileErrors = 0,
    int? memoryAtStart,
    int? memoryAtEnd,
  }) {
    return BackupBatchMetrics(
      successCount: successCount,
      failureCount: failureCount,
      batchDurationMs: endTime.difference(startTime).inMilliseconds,
      timeoutErrors: timeoutErrors,
      networkErrors: networkErrors,
      serverErrors: serverErrors,
      fileErrors: fileErrors,
      memoryAtStart: memoryAtStart,
      memoryAtEnd: memoryAtEnd,
      startTime: startTime,
      endTime: endTime,
    );
  }

  @override
  String toString() {
    return 'BackupBatchMetrics('
        'success: $successCount, '
        'failed: $failureCount, '
        'rate: ${(successRate * 100).toStringAsFixed(1)}%, '
        'duration: ${batchDurationMs}ms, '
        'avgPerAsset: ${avgTimePerAssetMs.toStringAsFixed(0)}ms)';
  }

  BackupBatchMetrics copyWith({
    int? successCount,
    int? failureCount,
    int? batchDurationMs,
    int? timeoutErrors,
    int? networkErrors,
    int? serverErrors,
    int? fileErrors,
    int? memoryAtStart,
    int? memoryAtEnd,
    DateTime? startTime,
    DateTime? endTime,
  }) {
    return BackupBatchMetrics(
      successCount: successCount ?? this.successCount,
      failureCount: failureCount ?? this.failureCount,
      batchDurationMs: batchDurationMs ?? this.batchDurationMs,
      timeoutErrors: timeoutErrors ?? this.timeoutErrors,
      networkErrors: networkErrors ?? this.networkErrors,
      serverErrors: serverErrors ?? this.serverErrors,
      fileErrors: fileErrors ?? this.fileErrors,
      memoryAtStart: memoryAtStart ?? this.memoryAtStart,
      memoryAtEnd: memoryAtEnd ?? this.memoryAtEnd,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
    );
  }
}

/// Aggregated metrics across multiple batches for analysis
class BackupSessionMetrics {
  final List<BackupBatchMetrics> batchHistory;
  final int maxHistorySize;

  BackupSessionMetrics({
    List<BackupBatchMetrics>? batchHistory,
    this.maxHistorySize = 20,
  }) : batchHistory = batchHistory ?? [];

  /// Add a batch's metrics to history
  void addBatch(BackupBatchMetrics metrics) {
    batchHistory.add(metrics);
    // Keep only recent history to avoid memory growth
    while (batchHistory.length > maxHistorySize) {
      batchHistory.removeAt(0);
    }
  }

  /// Get average success rate across recent batches
  double get averageSuccessRate {
    if (batchHistory.isEmpty) return 1.0;
    return batchHistory.map((m) => m.successRate).reduce((a, b) => a + b) / batchHistory.length;
  }

  /// Get average time per asset across recent batches
  double get averageTimePerAssetMs {
    if (batchHistory.isEmpty) return 0;
    final validBatches = batchHistory.where((m) => m.totalAttempted > 0);
    if (validBatches.isEmpty) return 0;
    return validBatches.map((m) => m.avgTimePerAssetMs).reduce((a, b) => a + b) / validBatches.length;
  }

  /// Count consecutive failures (batches with < 50% success rate)
  int get consecutiveFailures {
    int count = 0;
    for (int i = batchHistory.length - 1; i >= 0; i--) {
      if (batchHistory[i].successRate < 0.5) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /// Check if we're in a failure spiral
  bool get isInFailureSpiral => consecutiveFailures >= 3;

  /// Total assets uploaded in this session
  int get totalUploaded => batchHistory.fold(0, (sum, m) => sum + m.successCount);

  /// Total assets failed in this session
  int get totalFailed => batchHistory.fold(0, (sum, m) => sum + m.failureCount);

  /// Clear all history
  void clear() => batchHistory.clear();
}

