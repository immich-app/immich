import 'package:immich_mobile/shared/models/asset.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_asset.provider.g.dart';

@riverpod
class CurrentAsset extends _$CurrentAsset {
  @override
  Asset? build() => null;

  void updateCurrentAsset(Asset a) => state = a;
}
