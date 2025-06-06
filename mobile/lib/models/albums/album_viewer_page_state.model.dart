import 'dart:convert';

class AlbumViewerPageState {
  final bool isEditAlbum;
  final String editTitleText;
  final String editDescriptionText;

  AlbumViewerPageState({
    required this.isEditAlbum,
    required this.editTitleText,
    required this.editDescriptionText,
  });

  AlbumViewerPageState copyWith({
    bool? isEditAlbum,
    String? editTitleText,
    String? editDescriptionText,
  }) {
    return AlbumViewerPageState(
      isEditAlbum: isEditAlbum ?? this.isEditAlbum,
      editTitleText: editTitleText ?? this.editTitleText,
      editDescriptionText: editDescriptionText ?? this.editDescriptionText,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'isEditAlbum': isEditAlbum});
    result.addAll({'editTitleText': editTitleText});
    result.addAll({'editDescriptionText': editDescriptionText});

    return result;
  }

  factory AlbumViewerPageState.fromMap(Map<String, dynamic> map) {
    return AlbumViewerPageState(
      isEditAlbum: map['isEditAlbum'] ?? false,
      editTitleText: map['editTitleText'] ?? '',
      editDescriptionText: map['editDescriptionText'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory AlbumViewerPageState.fromJson(String source) =>
      AlbumViewerPageState.fromMap(json.decode(source));

  @override
  String toString() =>
      'AlbumViewerPageState(isEditAlbum: $isEditAlbum, editTitleText: $editTitleText, editDescriptionText: $editDescriptionText)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AlbumViewerPageState &&
        other.isEditAlbum == isEditAlbum &&
        other.editTitleText == editTitleText &&
        other.editDescriptionText == editDescriptionText;
  }

  @override
  int get hashCode =>
      isEditAlbum.hashCode ^
      editTitleText.hashCode ^
      editDescriptionText.hashCode;
}
