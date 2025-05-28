import 'dart:convert';

enum CastDestinationType { googleCast }

enum CastState { idle, playing, paused, buffering }

class CastManagerState {
  final bool isCasting;
  final String receiverName;
  final CastState castState;
  final Duration currentTime;
  final Duration duration;

  const CastManagerState({
    required this.isCasting,
    required this.receiverName,
    required this.castState,
    required this.currentTime,
    required this.duration,
  });

  CastManagerState copyWith({
    bool? isCasting,
    String? receiverName,
    CastState? castState,
    Duration? currentTime,
    Duration? duration,
  }) {
    return CastManagerState(
      isCasting: isCasting ?? this.isCasting,
      receiverName: receiverName ?? this.receiverName,
      castState: castState ?? this.castState,
      currentTime: currentTime ?? this.currentTime,
      duration: duration ?? this.duration,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'isCasting': isCasting});
    result.addAll({'receiverName': receiverName});
    result.addAll({'castState': castState});
    result.addAll({'currentTime': currentTime.inSeconds});
    result.addAll({'duration': duration.inSeconds});

    return result;
  }

  factory CastManagerState.fromMap(Map<String, dynamic> map) {
    return CastManagerState(
      isCasting: map['isCasting'] ?? false,
      receiverName: map['receiverName'] ?? '',
      castState: map['castState'] ?? CastState.idle,
      currentTime: Duration(seconds: map['currentTime']?.toInt() ?? 0),
      duration: Duration(seconds: map['duration']?.toInt() ?? 0),
    );
  }

  String toJson() => json.encode(toMap());

  factory CastManagerState.fromJson(String source) =>
      CastManagerState.fromMap(json.decode(source));

  @override
  String toString() =>
      'CastManagerState(isCasting: $isCasting, receiverName: $receiverName, castState: $castState, currentTime: $currentTime, duration: $duration)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is CastManagerState &&
        other.isCasting == isCasting &&
        other.receiverName == receiverName &&
        other.castState == castState &&
        other.currentTime == currentTime &&
        other.duration == duration;
  }

  @override
  int get hashCode =>
      isCasting.hashCode ^
      receiverName.hashCode ^
      castState.hashCode ^
      currentTime.hashCode ^
      duration.hashCode;
}
