// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'image_config.freezed.dart';

@freezed
class const ImageConfig({final bool preferRemote = false, final bool loadOriginal = false}) with _$ImageConfig;
