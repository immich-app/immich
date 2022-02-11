import 'dart:convert';

class ImageViewerPageState {
  final bool isBottomSheetEnable;
  ImageViewerPageState({
    required this.isBottomSheetEnable,
  });

  ImageViewerPageState copyWith({
    bool? isBottomSheetEnable,
  }) {
    return ImageViewerPageState(
      isBottomSheetEnable: isBottomSheetEnable ?? this.isBottomSheetEnable,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'isBottomSheetEnable': isBottomSheetEnable,
    };
  }

  factory ImageViewerPageState.fromMap(Map<String, dynamic> map) {
    return ImageViewerPageState(
      isBottomSheetEnable: map['isBottomSheetEnable'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory ImageViewerPageState.fromJson(String source) => ImageViewerPageState.fromMap(json.decode(source));

  @override
  String toString() => 'ImageViewerPageState(isBottomSheetEnable: $isBottomSheetEnable)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ImageViewerPageState && other.isBottomSheetEnable == isBottomSheetEnable;
  }

  @override
  int get hashCode => isBottomSheetEnable.hashCode;
}
