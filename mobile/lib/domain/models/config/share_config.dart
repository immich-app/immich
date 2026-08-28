// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/constants/enums.dart';

part 'share_config.freezed.dart';

@freezed
class const ShareConfig({final ShareAssetType fileType = .original}) with _$ShareConfig;
