import 'dart:convert';

/// Recovery level indicating the severity of issues encountered
enum RecoveryLevel {
  /// No recovery needed
  none,
  /// Level 1: Soft recovery - reduce batch size, add delay, continue
  soft,
  /// Level 2: Hard pause - save checkpoint, clear caches, longer cooldown
  hard,
  /// Level 3: Controlled restart (Android only) - restart app, auto-resume
  restart,
}

/// Status indicator for the adaptive throttle system
enum AdaptiveStatus {
  /// Initial state, no data yet
  initializing,
  /// System is probing to find optimal settings
  probing,
  /// Running normally with stable settings
  stable,
  /// Speeding up due to good performance
  accelerating,
  /// Slowing down due to issues
  decelerating,
  /// In recovery mode
  recovering,
  /// Paused (user initiated or system)
  paused,
}

/// Represents the current state of the adaptive throttling system.
/// 
/// This state is used by the UI to show progress and by the system
/// to make throttling decisions.
class AdaptiveThrottleState {
  /// Current batch size being used
  final int currentBatchSize;

  /// Current delay between batches in milliseconds
  final int currentDelayMs;

  /// Minimum allowed batch size
  final int minBatchSize;

  /// Maximum allowed batch size
  final int maxBatchSize;

  /// Minimum delay in milliseconds
  final int minDelayMs;

  /// Maximum delay in milliseconds
  final int maxDelayMs;

  /// Current status of the adaptive system
  final AdaptiveStatus status;

  /// Current recovery level (if any)
  final RecoveryLevel recoveryLevel;

  /// Number of consecutive successful batches
  final int consecutiveSuccesses;

  /// Number of consecutive failed batches
  final int consecutiveFailures;

  /// Current batch number being processed
  final int currentBatchNumber;

  /// Total number of batches estimated
  final int totalBatches;

  /// Whether adaptive throttling is enabled
  final bool isAdaptiveEnabled;

  /// Target time per asset in milliseconds (for optimization)
  final double targetTimePerAssetMs;

  /// Last adjustment reason (for UI display)
  final String? lastAdjustmentReason;

  /// Timestamp of last adjustment
  final DateTime? lastAdjustmentTime;

  const AdaptiveThrottleState({
    required this.currentBatchSize,
    required this.currentDelayMs,
    this.minBatchSize = 10,
    this.maxBatchSize = 200,
    this.minDelayMs = 0,
    this.maxDelayMs = 5000,
    this.status = AdaptiveStatus.initializing,
    this.recoveryLevel = RecoveryLevel.none,
    this.consecutiveSuccesses = 0,
    this.consecutiveFailures = 0,
    this.currentBatchNumber = 0,
    this.totalBatches = 0,
    this.isAdaptiveEnabled = true,
    this.targetTimePerAssetMs = 2000.0,
    this.lastAdjustmentReason,
    this.lastAdjustmentTime,
  });

  /// Create default initial state based on total asset count
  factory AdaptiveThrottleState.initial(int totalAssets) {
    final batchSize = _getInitialBatchSize(totalAssets);
    final delay = _getInitialDelay(totalAssets);
    final estimatedBatches = (totalAssets / batchSize).ceil();

    return AdaptiveThrottleState(
      currentBatchSize: batchSize,
      currentDelayMs: delay,
      totalBatches: estimatedBatches,
      status: AdaptiveStatus.initializing,
    );
  }

  /// Calculate initial batch size based on total assets
  static int _getInitialBatchSize(int totalAssets) {
    if (totalAssets < 500) return 50;
    if (totalAssets < 2000) return 30;
    if (totalAssets < 5000) return 25;
    return 20; // Very conservative for large libraries
  }

  /// Calculate initial delay based on total assets
  static int _getInitialDelay(int totalAssets) {
    if (totalAssets < 500) return 500;
    if (totalAssets < 2000) return 1000;
    if (totalAssets < 5000) return 1500;
    return 2000; // Longer delay for large libraries
  }

  /// Whether the system needs recovery
  bool get needsRecovery => recoveryLevel != RecoveryLevel.none;

  /// Whether currently in a good state
  bool get isHealthy => 
      status == AdaptiveStatus.stable || 
      status == AdaptiveStatus.accelerating;

  /// Progress through batches as percentage
  double get batchProgressPercent => 
      totalBatches > 0 ? (currentBatchNumber / totalBatches) * 100 : 0;

  /// Human-readable status message
  String get statusMessage {
    switch (status) {
      case AdaptiveStatus.initializing:
        return 'Starting backup...';
      case AdaptiveStatus.probing:
        return 'Optimizing speed...';
      case AdaptiveStatus.stable:
        return 'Backing up';
      case AdaptiveStatus.accelerating:
        return 'Speed optimized';
      case AdaptiveStatus.decelerating:
        return 'Adjusting speed...';
      case AdaptiveStatus.recovering:
        return 'Recovering...';
      case AdaptiveStatus.paused:
        return 'Paused';
    }
  }

  /// Create updated state with new batch size
  AdaptiveThrottleState withBatchSize(int newBatchSize, {String? reason}) {
    return copyWith(
      currentBatchSize: newBatchSize.clamp(minBatchSize, maxBatchSize),
      lastAdjustmentReason: reason,
      lastAdjustmentTime: DateTime.now(),
      totalBatches: _recalculateTotalBatches(newBatchSize),
    );
  }

  /// Create updated state with new delay
  AdaptiveThrottleState withDelay(int newDelayMs, {String? reason}) {
    return copyWith(
      currentDelayMs: newDelayMs.clamp(minDelayMs, maxDelayMs),
      lastAdjustmentReason: reason,
      lastAdjustmentTime: DateTime.now(),
    );
  }

  /// Create updated state after batch completes
  AdaptiveThrottleState afterBatch({
    required bool wasSuccessful,
    int? newBatchSize,
    int? newDelayMs,
    AdaptiveStatus? newStatus,
    String? adjustmentReason,
  }) {
    return copyWith(
      currentBatchNumber: currentBatchNumber + 1,
      consecutiveSuccesses: wasSuccessful ? consecutiveSuccesses + 1 : 0,
      consecutiveFailures: wasSuccessful ? 0 : consecutiveFailures + 1,
      currentBatchSize: newBatchSize,
      currentDelayMs: newDelayMs,
      status: newStatus ?? status,
      lastAdjustmentReason: adjustmentReason,
      lastAdjustmentTime: adjustmentReason != null ? DateTime.now() : lastAdjustmentTime,
    );
  }

  int _recalculateTotalBatches(int newBatchSize) {
    // Estimate remaining work
    final remainingBatches = totalBatches - currentBatchNumber;
    final assetsRemaining = remainingBatches * currentBatchSize;
    return currentBatchNumber + (assetsRemaining / newBatchSize).ceil();
  }

  AdaptiveThrottleState copyWith({
    int? currentBatchSize,
    int? currentDelayMs,
    int? minBatchSize,
    int? maxBatchSize,
    int? minDelayMs,
    int? maxDelayMs,
    AdaptiveStatus? status,
    RecoveryLevel? recoveryLevel,
    int? consecutiveSuccesses,
    int? consecutiveFailures,
    int? currentBatchNumber,
    int? totalBatches,
    bool? isAdaptiveEnabled,
    double? targetTimePerAssetMs,
    String? lastAdjustmentReason,
    DateTime? lastAdjustmentTime,
  }) {
    return AdaptiveThrottleState(
      currentBatchSize: currentBatchSize ?? this.currentBatchSize,
      currentDelayMs: currentDelayMs ?? this.currentDelayMs,
      minBatchSize: minBatchSize ?? this.minBatchSize,
      maxBatchSize: maxBatchSize ?? this.maxBatchSize,
      minDelayMs: minDelayMs ?? this.minDelayMs,
      maxDelayMs: maxDelayMs ?? this.maxDelayMs,
      status: status ?? this.status,
      recoveryLevel: recoveryLevel ?? this.recoveryLevel,
      consecutiveSuccesses: consecutiveSuccesses ?? this.consecutiveSuccesses,
      consecutiveFailures: consecutiveFailures ?? this.consecutiveFailures,
      currentBatchNumber: currentBatchNumber ?? this.currentBatchNumber,
      totalBatches: totalBatches ?? this.totalBatches,
      isAdaptiveEnabled: isAdaptiveEnabled ?? this.isAdaptiveEnabled,
      targetTimePerAssetMs: targetTimePerAssetMs ?? this.targetTimePerAssetMs,
      lastAdjustmentReason: lastAdjustmentReason ?? this.lastAdjustmentReason,
      lastAdjustmentTime: lastAdjustmentTime ?? this.lastAdjustmentTime,
    );
  }

  /// Convert to JSON for storage
  Map<String, dynamic> toJson() {
    return {
      'currentBatchSize': currentBatchSize,
      'currentDelayMs': currentDelayMs,
      'minBatchSize': minBatchSize,
      'maxBatchSize': maxBatchSize,
      'minDelayMs': minDelayMs,
      'maxDelayMs': maxDelayMs,
      'status': status.index,
      'recoveryLevel': recoveryLevel.index,
      'consecutiveSuccesses': consecutiveSuccesses,
      'consecutiveFailures': consecutiveFailures,
      'currentBatchNumber': currentBatchNumber,
      'totalBatches': totalBatches,
      'isAdaptiveEnabled': isAdaptiveEnabled,
      'targetTimePerAssetMs': targetTimePerAssetMs,
      'lastAdjustmentReason': lastAdjustmentReason,
      'lastAdjustmentTime': lastAdjustmentTime?.toIso8601String(),
    };
  }

  /// Create from JSON
  factory AdaptiveThrottleState.fromJson(Map<String, dynamic> json) {
    return AdaptiveThrottleState(
      currentBatchSize: json['currentBatchSize'] as int,
      currentDelayMs: json['currentDelayMs'] as int,
      minBatchSize: json['minBatchSize'] as int? ?? 10,
      maxBatchSize: json['maxBatchSize'] as int? ?? 200,
      minDelayMs: json['minDelayMs'] as int? ?? 0,
      maxDelayMs: json['maxDelayMs'] as int? ?? 5000,
      status: AdaptiveStatus.values[json['status'] as int? ?? 0],
      recoveryLevel: RecoveryLevel.values[json['recoveryLevel'] as int? ?? 0],
      consecutiveSuccesses: json['consecutiveSuccesses'] as int? ?? 0,
      consecutiveFailures: json['consecutiveFailures'] as int? ?? 0,
      currentBatchNumber: json['currentBatchNumber'] as int? ?? 0,
      totalBatches: json['totalBatches'] as int? ?? 0,
      isAdaptiveEnabled: json['isAdaptiveEnabled'] as bool? ?? true,
      targetTimePerAssetMs: (json['targetTimePerAssetMs'] as num?)?.toDouble() ?? 2000.0,
      lastAdjustmentReason: json['lastAdjustmentReason'] as String?,
      lastAdjustmentTime: json['lastAdjustmentTime'] != null 
          ? DateTime.parse(json['lastAdjustmentTime'] as String)
          : null,
    );
  }

  /// Serialize to string for storage
  String toJsonString() => jsonEncode(toJson());

  /// Deserialize from string
  factory AdaptiveThrottleState.fromJsonString(String jsonString) {
    return AdaptiveThrottleState.fromJson(jsonDecode(jsonString) as Map<String, dynamic>);
  }

  @override
  String toString() {
    return 'AdaptiveThrottleState('
        'batch: $currentBatchSize, '
        'delay: ${currentDelayMs}ms, '
        'status: $status, '
        'batch#: $currentBatchNumber/$totalBatches)';
  }
}

