/// A class to calculate upload speed based on progress updates.
///
/// Tracks bytes transferred over time and calculates average speed
/// using a sliding window approach to smooth out fluctuations.
class UploadSpeedCalculator {
  /// Creates an UploadSpeedCalculator with the given window size.
  ///
  /// [windowSize] determines how many recent samples to use for
  /// calculating the average speed. Default is 5 samples.
  UploadSpeedCalculator({this.windowSize = 5});

  /// The number of samples to keep in the sliding window.
  final int windowSize;

  /// List of recent speed samples (bytes per second).
  final List<double> _speedSamples = [];

  /// The timestamp of the last progress update.
  DateTime? _lastUpdateTime;

  /// The bytes transferred at the last progress update.
  int _lastBytes = 0;

  /// The total file size being uploaded.
  int _totalBytes = 0;

  /// Resets the calculator for a new upload.
  void reset() {
    _speedSamples.clear();
    _lastUpdateTime = null;
    _lastBytes = 0;
    _totalBytes = 0;
  }

  /// Updates the calculator with the current progress.
  ///
  /// [currentBytes] is the number of bytes transferred so far.
  /// [totalBytes] is the total size of the file being uploaded.
  ///
  /// Returns the calculated speed in MB/s, or -1 if not enough data.
  double update(int currentBytes, int totalBytes) {
    final now = DateTime.now();
    _totalBytes = totalBytes;

    if (_lastUpdateTime == null) {
      _lastUpdateTime = now;
      _lastBytes = currentBytes;
      return -1;
    }

    final elapsed = now.difference(_lastUpdateTime!);

    // Only calculate if at least 100ms has passed to avoid division by very small numbers
    if (elapsed.inMilliseconds < 100) {
      return _currentSpeed;
    }

    final bytesTransferred = currentBytes - _lastBytes;
    final elapsedSeconds = elapsed.inMilliseconds / 1000.0;

    // Calculate bytes per second, then convert to MB/s
    final bytesPerSecond = bytesTransferred / elapsedSeconds;
    final mbPerSecond = bytesPerSecond / (1024 * 1024);

    // Add to sliding window
    _speedSamples.add(mbPerSecond);
    if (_speedSamples.length > windowSize) {
      _speedSamples.removeAt(0);
    }

    _lastUpdateTime = now;
    _lastBytes = currentBytes;

    return _currentSpeed;
  }

  /// Returns the current calculated speed in MB/s.
  ///
  /// Returns -1 if no valid speed has been calculated yet.
  double get _currentSpeed {
    if (_speedSamples.isEmpty) {
      return -1;
    }
    // Calculate average of all samples in the window
    final sum = _speedSamples.fold(0.0, (prev, speed) => prev + speed);
    return sum / _speedSamples.length;
  }

  /// Returns the current speed in MB/s, or -1 if not available.
  double get speed => _currentSpeed;

  /// Returns a human-readable string representation of the current speed.
  ///
  /// Returns '-- MB/s' if N/A, otherwise in MB/s or kB/s format.
  String get speedAsString {
    final s = _currentSpeed;
    return switch (s) {
      <= 0 => '-- MB/s',
      >= 1 => '${s.round()} MB/s',
      _ => '${(s * 1000).round()} kB/s',
    };
  }

  /// Returns the estimated time remaining as a Duration.
  ///
  /// Returns Duration with negative seconds if not calculable.
  Duration get timeRemaining {
    final s = _currentSpeed;
    if (s <= 0 || _totalBytes <= 0 || _lastBytes >= _totalBytes) {
      return const Duration(seconds: -1);
    }

    final remainingBytes = _totalBytes - _lastBytes;
    final bytesPerSecond = s * 1024 * 1024;
    final secondsRemaining = remainingBytes / bytesPerSecond;

    return Duration(seconds: secondsRemaining.round());
  }

  /// Returns a human-readable string representation of time remaining.
  ///
  /// Returns '--:--' if N/A, otherwise HH:MM:SS or MM:SS format.
  String get timeRemainingAsString {
    final remaining = timeRemaining;
    return switch (remaining.inSeconds) {
      <= 0 => '--:--',
      < 3600 =>
        '${remaining.inMinutes.toString().padLeft(2, "0")}'
            ':${remaining.inSeconds.remainder(60).toString().padLeft(2, "0")}',
      _ =>
        '${remaining.inHours}'
            ':${remaining.inMinutes.remainder(60).toString().padLeft(2, "0")}'
            ':${remaining.inSeconds.remainder(60).toString().padLeft(2, "0")}',
    };
  }
}

/// Manager for tracking upload speeds for multiple concurrent uploads.
///
/// Each upload is identified by a unique task ID.
class UploadSpeedManager {
  /// Map of task IDs to their speed calculators.
  final Map<String, UploadSpeedCalculator> _calculators = {};

  /// Gets or creates a speed calculator for the given task ID.
  UploadSpeedCalculator getCalculator(String taskId) {
    return _calculators.putIfAbsent(taskId, () => UploadSpeedCalculator());
  }

  /// Updates progress for a specific task and returns the speed string.
  ///
  /// [taskId] is the unique identifier for the upload task.
  /// [currentBytes] is the number of bytes transferred so far.
  /// [totalBytes] is the total size of the file being uploaded.
  ///
  /// Returns the human-readable speed string.
  String updateProgress(String taskId, int currentBytes, int totalBytes) {
    final calculator = getCalculator(taskId);
    calculator.update(currentBytes, totalBytes);
    return calculator.speedAsString;
  }

  /// Gets the current speed string for a specific task.
  String getSpeedAsString(String taskId) {
    return _calculators[taskId]?.speedAsString ?? '-- MB/s';
  }

  /// Gets the time remaining string for a specific task.
  String getTimeRemainingAsString(String taskId) {
    return _calculators[taskId]?.timeRemainingAsString ?? '--:--';
  }

  /// Removes a task from tracking.
  void removeTask(String taskId) {
    _calculators.remove(taskId);
  }

  /// Clears all tracked tasks.
  void clear() {
    _calculators.clear();
  }
}
