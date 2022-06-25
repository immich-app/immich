import 'dart:convert';

class AlbumViewerPageState {
  final bool isEditAlbum;
  final String editTitleText;
  AlbumViewerPageState({
    required this.isEditAlbum,
    required this.editTitleText,
  });

  AlbumViewerPageState copyWith({
    bool? isEditAlbum,
    String? editTitleText,
  }) {
    return AlbumViewerPageState(
      isEditAlbum: isEditAlbum ?? this.isEditAlbum,
      editTitleText: editTitleText ?? this.editTitleText,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'isEditAlbum': isEditAlbum});
    result.addAll({'editTitleText': editTitleText});

    return result;
  }

  factory AlbumViewerPageState.fromMap(Map<String, dynamic> map) {
    return AlbumViewerPageState(
      isEditAlbum: map['isEditAlbum'] ?? false,
      editTitleText: map['editTitleText'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory AlbumViewerPageState.fromJson(String source) =>
      AlbumViewerPageState.fromMap(json.decode(source));

  @override
  String toString() =>
      'AlbumViewerPageState(isEditAlbum: $isEditAlbum, editTitleText: $editTitleText)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AlbumViewerPageState &&
        other.isEditAlbum == isEditAlbum &&
        other.editTitleText == editTitleText;
  }

  @override
  int get hashCode => isEditAlbum.hashCode ^ editTitleText.hashCode;
}
