import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/constants/enums.dart';

part 'share_config.freezed.dart';

@freezed
abstract class ShareConfig with _$ShareConfig {
  const factory ShareConfig({@Default(ShareAssetType.original) ShareAssetType fileType}) = _ShareConfig;
}
