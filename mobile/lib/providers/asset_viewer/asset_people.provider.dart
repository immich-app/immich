import 'package:immich_mobile/domain/models/person.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:logging/logging.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'asset_people.provider.g.dart';

/// Maintains the list of people for an asset.
@riverpod
class AssetPeopleNotifier extends _$AssetPeopleNotifier {
  final log = Logger('AssetPeopleNotifier');

  @override
  Future<List<Person>> build(Asset asset) async {
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
    return list
        .map(
          (e) => Person(
            id: e.id,
            name: e.name,
            thumbnailPath: e.thumbnailPath,
            isHidden: e.isHidden,
            updatedAt: e.updatedAt,
          ),
        )
        .toList();
  }

  Future<void> refresh() async {
    // invalidate the state – this way we don't have to
    // duplicate the code from build.
    ref.invalidateSelf();
  }
}
