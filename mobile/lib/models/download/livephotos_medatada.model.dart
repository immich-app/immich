// ignore_for_file: annotate_overrides

import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';

part 'livephotos_medatada.model.freezed.dart';

enum LivePhotosPart { video, image }

@Freezed(fromJson: false, toJson: false)
class const LivePhotosMetadata({required final LivePhotosPart part, required final String id})
    with _$LivePhotosMetadata {
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
