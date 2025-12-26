import 'dart:convert';

/// Represents a checkpoint in the backup process for resume capability.
/// 
/// This checkpoint is persisted to storage so that if the app is closed,
/// crashes, or needs to restart, the backup can resume from where it left off.
class BackupCheckpoint {
  /// Current position in the asset list (cursor)
  final int cursorPosition;

  /// Total number of assets to backup in this session
  final int totalAssets;

  /// Number of assets successfully uploaded so far
  final int uploadedCount;

  /// Number of assets that failed to upload
  final int failedCount;

  /// Timestamp when this checkpoint was created
  final DateTime timestamp;

  /// The batch size that was working well (for resume)
  final int lastGoodBatchSize;

  /// The delay that was working well (for resume)
  final int lastGoodDelayMs;

  /// Session ID to identify this backup run
  final String sessionId;

  /// Whether this checkpoint represents an interrupted backup
  final bool wasInterrupted;

  const BackupCheckpoint({
    required this.cursorPosition,
    required this.totalAssets,
    required this.uploadedCount,
    required this.failedCount,
    required this.timestamp,
    required this.lastGoodBatchSize,
    required this.lastGoodDelayMs,
    required this.sessionId,
    this.wasInterrupted = false,
  });

  /// Progress as a percentage (0.0 to 100.0)
  double get progressPercent => totalAssets > 0 ? (cursorPosition / totalAssets) * 100 : 0;

  /// Remaining assets to process
  int get remainingAssets => totalAssets - cursorPosition;

  /// Whether backup is complete
  bool get isComplete => cursorPosition >= totalAssets;

  /// Create an initial checkpoint for a new backup session
  factory BackupCheckpoint.initial({
    required int totalAssets,
    required String sessionId,
    int initialBatchSize = 30,
    int initialDelayMs = 1000,
  }) {
    return BackupCheckpoint(
      cursorPosition: 0,
      totalAssets: totalAssets,
      uploadedCount: 0,
      failedCount: 0,
      timestamp: DateTime.now(),
      lastGoodBatchSize: initialBatchSize,
      lastGoodDelayMs: initialDelayMs,
      sessionId: sessionId,
      wasInterrupted: false,
    );
  }

  /// Create an updated checkpoint after processing a batch
  BackupCheckpoint update({
    required int newCursorPosition,
    required int additionalUploaded,
    required int additionalFailed,
    int? newBatchSize,
    int? newDelayMs,
  }) {
    return BackupCheckpoint(
      cursorPosition: newCursorPosition,
      totalAssets: totalAssets,
      uploadedCount: uploadedCount + additionalUploaded,
      failedCount: failedCount + additionalFailed,
      timestamp: DateTime.now(),
      lastGoodBatchSize: newBatchSize ?? lastGoodBatchSize,
      lastGoodDelayMs: newDelayMs ?? lastGoodDelayMs,
      sessionId: sessionId,
      wasInterrupted: false,
    );
  }

  /// Mark this checkpoint as interrupted (for recovery detection)
  BackupCheckpoint markInterrupted() {
    return BackupCheckpoint(
      cursorPosition: cursorPosition,
      totalAssets: totalAssets,
      uploadedCount: uploadedCount,
      failedCount: failedCount,
      timestamp: timestamp,
      lastGoodBatchSize: lastGoodBatchSize,
      lastGoodDelayMs: lastGoodDelayMs,
      sessionId: sessionId,
      wasInterrupted: true,
    );
  }

  /// Convert to JSON for storage
  Map<String, dynamic> toJson() {
    return {
      'cursorPosition': cursorPosition,
      'totalAssets': totalAssets,
      'uploadedCount': uploadedCount,
      'failedCount': failedCount,
      'timestamp': timestamp.toIso8601String(),
      'lastGoodBatchSize': lastGoodBatchSize,
      'lastGoodDelayMs': lastGoodDelayMs,
      'sessionId': sessionId,
      'wasInterrupted': wasInterrupted,
    };
  }

  /// Create from JSON
  factory BackupCheckpoint.fromJson(Map<String, dynamic> json) {
    return BackupCheckpoint(
      cursorPosition: json['cursorPosition'] as int,
      totalAssets: json['totalAssets'] as int,
      uploadedCount: json['uploadedCount'] as int,
      failedCount: json['failedCount'] as int,
      timestamp: DateTime.parse(json['timestamp'] as String),
      lastGoodBatchSize: json['lastGoodBatchSize'] as int,
      lastGoodDelayMs: json['lastGoodDelayMs'] as int,
      sessionId: json['sessionId'] as String,
      wasInterrupted: json['wasInterrupted'] as bool? ?? false,
    );
  }

  /// Serialize to string for storage
  String toJsonString() => jsonEncode(toJson());

  /// Deserialize from string
  factory BackupCheckpoint.fromJsonString(String jsonString) {
    return BackupCheckpoint.fromJson(jsonDecode(jsonString) as Map<String, dynamic>);
  }

  @override
  String toString() {
    return 'BackupCheckpoint('
        'cursor: $cursorPosition/$totalAssets, '
        'uploaded: $uploadedCount, '
        'failed: $failedCount, '
        'progress: ${progressPercent.toStringAsFixed(1)}%, '
        'interrupted: $wasInterrupted)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BackupCheckpoint &&
        other.cursorPosition == cursorPosition &&
        other.totalAssets == totalAssets &&
        other.uploadedCount == uploadedCount &&
        other.failedCount == failedCount &&
        other.sessionId == sessionId;
  }

  @override
  int get hashCode {
    return Object.hash(
      cursorPosition,
      totalAssets,
      uploadedCount,
      failedCount,
      sessionId,
    );
  }
}

