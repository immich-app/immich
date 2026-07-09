import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/actions/stack.action.dart';

class AssetActions {
  final AssetDebugAction debug;
  final FavoriteAction favorite;
  final ArchiveAction archive;
  final StackAction stack;
  final LockAction lock;

  const AssetActions({
    required this.debug,
    required this.favorite,
    required this.archive,
    required this.stack,
    required this.lock,
  });

  static AssetActions from(ActionScope scope, List<BaseAsset> assets) => .new(
    debug: AssetDebugAction(assets: assets, scope: scope),
    favorite: FavoriteAction(assets: assets, scope: scope),
    archive: ArchiveAction(assets: assets, scope: scope),
    stack: StackAction(assets: assets, scope: scope),
    lock: LockAction(assets: assets, scope: scope),
  );
}
