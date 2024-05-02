import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'asset_people.provider.g.dart';

/// Maintains the list of people for an asset.
@riverpod
class AssetPeopleNotifier extends _$AssetPeopleNotifier {
  final log = Logger('AssetPeopleNotifier');

  @override
  Future<List<PersonWithFacesResponseDto>> build(Asset asset) async {
    if (!asset.isRemote) {
      return [];
    }

    final list = await ref
        .watch(assetServiceProvider)
        .getRemotePeopleOfAsset(asset.remoteId!);
    if (list == null) {
      return [];
    }

    // explicitly a sorted slice to make it deterministic
    // named people will be at the beginning, and names are sorted
    // ascendingly
    list.sort((a, b) {
      final aNotEmpty = a.name.isNotEmpty;
      final bNotEmpty = b.name.isNotEmpty;
      if (aNotEmpty && !bNotEmpty) {
        return -1;
      } else if (!aNotEmpty && bNotEmpty) {
        return 1;
      } else if (!aNotEmpty && !bNotEmpty) {
        return 0;
      }

      return a.name.compareTo(b.name);
    });
    return list;
  }

  Future<void> refresh() async {
    // invalidate the state – this way we don't have to
    // duplicate the code from build.
    ref.invalidateSelf();
  }
}
