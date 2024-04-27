part of 'home_cubit.dart';

class HomeState {
  final int albumCount;
  HomeState({
    required this.albumCount,
  });

  HomeState copyWith({
    int? albumCount,
  }) {
    return HomeState(
      albumCount: albumCount ?? this.albumCount,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'albumCount': albumCount,
    };
  }

  factory HomeState.fromMap(Map<String, dynamic> map) {
    return HomeState(
      albumCount: map['albumCount']?.toInt() ?? 0,
    );
  }

  @override
  String toString() => 'HomeState(albumCount: $albumCount)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is HomeState && other.albumCount == albumCount;
  }

  @override
  int get hashCode => albumCount.hashCode;
}
