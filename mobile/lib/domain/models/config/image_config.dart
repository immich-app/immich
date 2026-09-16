import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'image_config.freezed.dart';

@freezed
abstract class ImageConfig with _$ImageConfig {
  const factory ImageConfig({
    @Default(false) bool preferRemote,
    @Default(true) bool loadPreview,
    @Default(false) bool loadOriginal,
  }) = _ImageConfig;
}
