import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';

part 'livephotos_medatada.model.freezed.dart';

enum LivePhotosPart { video, image }

@Freezed(fromJson: false, toJson: false)
abstract class LivePhotosMetadata with _$LivePhotosMetadata {
  const LivePhotosMetadata._();

  const factory LivePhotosMetadata({required LivePhotosPart part, required String id}) = _LivePhotosMetadata;

  Map<String, dynamic> toMap() {
    return <String, dynamic>{'part': part.index, 'id': id};
  }

  factory LivePhotosMetadata.fromMap(Map<String, dynamic> map) {
    return LivePhotosMetadata(part: LivePhotosPart.values[map['part'] as int], id: map['id'] as String);
  }

  String toJson() => json.encode(toMap());

  factory LivePhotosMetadata.fromJson(String source) =>
      LivePhotosMetadata.fromMap(json.decode(source) as Map<String, dynamic>);
}
