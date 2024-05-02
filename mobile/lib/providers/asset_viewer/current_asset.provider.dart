import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_asset.provider.g.dart';

@riverpod
class CurrentAsset extends _$CurrentAsset {
  @override
  Asset? build() => null;

  void set(Asset? a) => state = a;
}

/// Mock class for testing
abstract class CurrentAssetInternal extends _$CurrentAsset {}
