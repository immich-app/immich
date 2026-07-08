import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/actions/stack.action.dart';

class AssetActions {
  final AssetDebugAction debug;
  final FavoriteAction favorite;
  final ArchiveAction archive;
  final StackAction stack;
  final LockAction lock;
  final DeleteAction delete;
  final CleanupLocalAction cleanup;

  const AssetActions({
    required this.debug,
    required this.favorite,
    required this.archive,
    required this.stack,
    required this.lock,
    required this.delete,
    required this.cleanup,
  });

  factory AssetActions.from(ActionScope scope, List<BaseAsset> assets) => .new(
    debug: AssetDebugAction(assets: assets, scope: scope),
    favorite: FavoriteAction(assets: assets, scope: scope),
    archive: ArchiveAction(assets: assets, scope: scope),
    stack: StackAction(assets: assets, scope: scope),
    lock: LockAction(assets: assets, scope: scope),
    delete: DeleteAction(assets: assets, scope: scope),
    cleanup: CleanupLocalAction(assets: assets, scope: scope),
  );
}
