import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/backup/adaptive_state.model.dart';
import 'package:immich_mobile/models/backup/backup_metrics.model.dart';
import 'package:logging/logging.dart';

final adaptiveThrottleControllerProvider = Provider<AdaptiveThrottleController>((ref) {
  return AdaptiveThrottleController();
});

/// Controller that implements the "Goldilocks" adaptive throttling algorithm.
/// 
/// This controller automatically adjusts batch sizes and delays based on 
/// real-time performance metrics to optimize backup speed while preventing
/// system overload.
/// 
/// The algorithm:
/// - "Too hot" (errors, slowdowns): Reduce batch size, increase delay
/// - "Too cold" (fast, all success): Increase batch size, reduce delay
/// - "Just right" (stable performance): Maintain current settings
class AdaptiveThrottleController {
  final Logger _log = Logger('AdaptiveThrottleController');
  
  /// Current state of the throttle system
  AdaptiveThrottleState _state = const AdaptiveThrottleState(
    currentBatchSize: 30,
    currentDelayMs: 1000,
  );

  /// Session metrics for trend analysis
  final BackupSessionMetrics _sessionMetrics = BackupSessionMetrics();

  /// Stream controller for state changes
  final _stateController = StreamController<AdaptiveThrottleState>.broadcast();

  /// Target average time per asset in milliseconds (2 seconds)
  static const double _targetTimePerAssetMs = 2000.0;

  /// Threshold for "fast" performance (under 1 second per asset)
  static const double _fastThresholdMs = 1000.0;

  /// Number of successful batches before attempting to speed up
  static const int _successesBeforeSpeedUp = 3;

  /// Memory threshold percentage to trigger soft recovery (0.0-1.0)
  static const double _memoryThresholdSoft = 0.70;

  /// Memory threshold percentage to trigger hard recovery (0.0-1.0)
  static const double _memoryThresholdHard = 0.85;

  /// Maximum consecutive failures before triggering recovery
  static const int _maxConsecutiveFailures = 5;

  /// Get current state
  AdaptiveThrottleState get state => _state;

  /// Stream of state changes
  Stream<AdaptiveThrottleState> get stateStream => _stateController.stream;

  /// Current batch size
  int get currentBatchSize => _state.currentBatchSize;

  /// Current delay in milliseconds
  int get delayMs => _state.currentDelayMs;

  /// Whether recovery is needed
  bool get needsRecovery => _state.needsRecovery;

  /// Current recovery level
  RecoveryLevel get recoveryLevel => _state.recoveryLevel;

  /// Initialize the controller for a new backup session
  void initialize(int totalAssets) {
    _sessionMetrics.clear();
    _state = AdaptiveThrottleState.initial(totalAssets);
    _state = _state.copyWith(status: AdaptiveStatus.probing);
    _emitState();
    _log.info('Initialized adaptive throttle for $totalAssets assets. '
        'Starting with batch size: ${_state.currentBatchSize}, '
        'delay: ${_state.currentDelayMs}ms');
  }

  /// Reset the controller
  void reset() {
    _sessionMetrics.clear();
    _state = const AdaptiveThrottleState(
      currentBatchSize: 30,
      currentDelayMs: 1000,
    );
    _emitState();
  }

  /// Restore state from a checkpoint (for resume)
  void restoreFromCheckpoint(int batchSize, int delayMs) {
    _state = _state.copyWith(
      currentBatchSize: batchSize,
      currentDelayMs: delayMs,
      status: AdaptiveStatus.stable,
    );
    _emitState();
    _log.info('Restored throttle state: batch=$batchSize, delay=${delayMs}ms');
  }

  /// Process metrics after a batch completes and adjust throttle settings
  /// 
  /// This is the core "Goldilocks" algorithm implementation
  void adjustAfterBatch(BackupBatchMetrics metrics) {
    _sessionMetrics.addBatch(metrics);
    
    // Determine new settings based on metrics
    final adjustment = _calculateAdjustment(metrics);
    
    // Apply the adjustment
    _state = _state.afterBatch(
      wasSuccessful: metrics.successRate >= 0.9,
      newBatchSize: adjustment.newBatchSize,
      newDelayMs: adjustment.newDelayMs,
      newStatus: adjustment.newStatus,
      adjustmentReason: adjustment.reason,
    );

    // Check if recovery is needed
    _checkForRecoveryNeeded(metrics);

    _emitState();
    
    if (adjustment.reason != null) {
      _log.info('Throttle adjusted: ${adjustment.reason}. '
          'New batch size: ${_state.currentBatchSize}, '
          'delay: ${_state.currentDelayMs}ms');
    }
  }

  /// Calculate what adjustment to make based on metrics
  _ThrottleAdjustment _calculateAdjustment(BackupBatchMetrics metrics) {
    // Check for failure conditions first
    if (metrics.successRate < 0.5) {
      // Critical failure - aggressive slowdown
      return _ThrottleAdjustment(
        newBatchSize: math.max(_state.minBatchSize, (_state.currentBatchSize * 0.3).round()),
        newDelayMs: math.min(_state.maxDelayMs, _state.currentDelayMs + 2000),
        newStatus: AdaptiveStatus.decelerating,
        reason: 'High failure rate (${(metrics.successRate * 100).toStringAsFixed(0)}%)',
      );
    }

    if (metrics.successRate < 0.9 || metrics.hasTimeouts) {
      // Moderate issues - slow down
      return _ThrottleAdjustment(
        newBatchSize: math.max(_state.minBatchSize, (_state.currentBatchSize * 0.7).round()),
        newDelayMs: math.min(_state.maxDelayMs, _state.currentDelayMs + 1000),
        newStatus: AdaptiveStatus.decelerating,
        reason: metrics.hasTimeouts 
            ? 'Timeout detected' 
            : 'Success rate below 90%',
      );
    }

    // Check if we're in a failure spiral
    if (_sessionMetrics.isInFailureSpiral) {
      return _ThrottleAdjustment(
        newBatchSize: _state.minBatchSize,
        newDelayMs: _state.maxDelayMs,
        newStatus: AdaptiveStatus.recovering,
        reason: 'Multiple consecutive failures',
      );
    }

    // All good - check if we can speed up
    if (metrics.successRate == 1.0 && _state.consecutiveSuccesses >= _successesBeforeSpeedUp) {
      if (metrics.avgTimePerAssetMs < _fastThresholdMs) {
        // Things are going great and fast - speed up
        final newBatchSize = math.min(
          _state.maxBatchSize,
          (_state.currentBatchSize * 1.5).round(),
        );
        final newDelay = math.max(
          _state.minDelayMs,
          _state.currentDelayMs - 500,
        );

        if (newBatchSize > _state.currentBatchSize || newDelay < _state.currentDelayMs) {
          return _ThrottleAdjustment(
            newBatchSize: newBatchSize,
            newDelayMs: newDelay,
            newStatus: AdaptiveStatus.accelerating,
            reason: 'Performance is excellent, speeding up',
          );
        }
      } else if (metrics.avgTimePerAssetMs < _targetTimePerAssetMs) {
        // Good but not amazing - modest increase
        final newBatchSize = math.min(
          _state.maxBatchSize,
          (_state.currentBatchSize * 1.2).round(),
        );

        if (newBatchSize > _state.currentBatchSize) {
          return _ThrottleAdjustment(
            newBatchSize: newBatchSize,
            newDelayMs: _state.currentDelayMs,
            newStatus: AdaptiveStatus.accelerating,
            reason: 'Good performance, slight speed increase',
          );
        }
      }
    }

    // Just right - maintain current settings
    final newStatus = _state.status == AdaptiveStatus.probing && _state.currentBatchNumber >= 3
        ? AdaptiveStatus.stable
        : _state.status;

    return _ThrottleAdjustment(
      newBatchSize: _state.currentBatchSize,
      newDelayMs: _state.currentDelayMs,
      newStatus: newStatus,
      reason: null,
    );
  }

  /// Check if recovery actions are needed based on metrics
  void _checkForRecoveryNeeded(BackupBatchMetrics metrics) {
    RecoveryLevel level = RecoveryLevel.none;

    // Check consecutive failures
    if (_state.consecutiveFailures >= _maxConsecutiveFailures) {
      level = RecoveryLevel.hard;
    } else if (_state.consecutiveFailures >= 3) {
      level = RecoveryLevel.soft;
    }

    // Check memory if available
    if (metrics.memoryAtEnd != null && metrics.memoryAtStart != null) {
      // This is a simplified check - in real implementation we'd check against
      // total available memory
      final memoryGrowth = metrics.memoryDelta ?? 0;
      if (memoryGrowth > 100 * 1024 * 1024) { // 100MB growth in one batch
        level = level.index > RecoveryLevel.soft.index ? level : RecoveryLevel.soft;
      }
    }

    // Check if failure spiral
    if (_sessionMetrics.isInFailureSpiral) {
      level = level.index > RecoveryLevel.hard.index ? level : RecoveryLevel.hard;
    }

    if (level != RecoveryLevel.none) {
      _state = _state.copyWith(
        recoveryLevel: level,
        status: AdaptiveStatus.recovering,
      );
      _log.warning('Recovery level set to: $level');
    }
  }

  /// Clear recovery state after recovery completes
  void clearRecovery() {
    _state = _state.copyWith(
      recoveryLevel: RecoveryLevel.none,
      status: AdaptiveStatus.stable,
      consecutiveFailures: 0,
    );
    _emitState();
    _log.info('Recovery completed, resuming normal operation');
  }

  /// Manually set batch size (for advanced users)
  void setManualBatchSize(int batchSize) {
    _state = _state.copyWith(
      currentBatchSize: batchSize.clamp(_state.minBatchSize, _state.maxBatchSize),
      isAdaptiveEnabled: false,
      lastAdjustmentReason: 'Manual override',
      lastAdjustmentTime: DateTime.now(),
    );
    _emitState();
  }

  /// Manually set delay (for advanced users)
  void setManualDelay(int delayMs) {
    _state = _state.copyWith(
      currentDelayMs: delayMs.clamp(_state.minDelayMs, _state.maxDelayMs),
      isAdaptiveEnabled: false,
      lastAdjustmentReason: 'Manual override',
      lastAdjustmentTime: DateTime.now(),
    );
    _emitState();
  }

  /// Re-enable adaptive mode
  void enableAdaptive() {
    _state = _state.copyWith(
      isAdaptiveEnabled: true,
      status: AdaptiveStatus.probing,
    );
    _sessionMetrics.clear();
    _emitState();
  }

  /// Pause the throttle
  void pause() {
    _state = _state.copyWith(status: AdaptiveStatus.paused);
    _emitState();
  }

  /// Resume from pause
  void resume() {
    _state = _state.copyWith(status: AdaptiveStatus.stable);
    _emitState();
  }

  /// Update batch progress
  void updateBatchProgress(int currentBatch, int totalBatches) {
    _state = _state.copyWith(
      currentBatchNumber: currentBatch,
      totalBatches: totalBatches,
    );
    _emitState();
  }

  /// Get session metrics for display
  BackupSessionMetrics get sessionMetrics => _sessionMetrics;

  void _emitState() {
    if (!_stateController.isClosed) {
      _stateController.add(_state);
    }
  }

  /// Dispose resources
  void dispose() {
    _stateController.close();
  }
}

/// Internal class to represent a throttle adjustment decision
class _ThrottleAdjustment {
  final int newBatchSize;
  final int newDelayMs;
  final AdaptiveStatus newStatus;
  final String? reason;

  const _ThrottleAdjustment({
    required this.newBatchSize,
    required this.newDelayMs,
    required this.newStatus,
    this.reason,
  });
}

