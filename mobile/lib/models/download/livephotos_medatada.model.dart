// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

enum LivePhotosPart {
  video,
  image,
}

class LivePhotosMetadata {
  // enum
  LivePhotosPart part;

  String id;
  LivePhotosMetadata({
    required this.part,
    required this.id,
  });

  LivePhotosMetadata copyWith({
    LivePhotosPart? part,
    String? id,
  }) {
    return LivePhotosMetadata(
      part: part ?? this.part,
      id: id ?? this.id,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'part': part.index,
      'id': id,
    };
  }

  factory LivePhotosMetadata.fromMap(Map<String, dynamic> map) {
    return LivePhotosMetadata(
      part: LivePhotosPart.values[map['part'] as int],
      id: map['id'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory LivePhotosMetadata.fromJson(String source) =>
      LivePhotosMetadata.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'LivePhotosMetadata(part: $part, id: $id)';

  @override
  bool operator ==(covariant LivePhotosMetadata other) {
    if (identical(this, other)) return true;

    return other.part == part && other.id == id;
  }

  @override
  int get hashCode => part.hashCode ^ id.hashCode;
}
