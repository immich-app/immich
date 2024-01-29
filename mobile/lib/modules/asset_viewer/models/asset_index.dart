class AssetIndex {
  final int currentIndex;
  final int stackIndex;

  AssetIndex({required this.currentIndex, this.stackIndex = 0});

  AssetIndex copyWith({int? currentIndex, int? stackIndex}) {
    return AssetIndex(
      currentIndex: currentIndex ?? this.currentIndex,
      stackIndex: stackIndex ?? this.stackIndex,
    );
  }
}
