import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/auth.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';

final authRepositoryProvider = Provider<IAuthRepository>(
  (ref) => AuthRepository(ref.watch(dbProvider)),
);

class AuthRepository extends DatabaseRepository implements IAuthRepository {
  AuthRepository(super.db);

  @override
  Future<void> clearLocalData() async {
    await db.writeTxn(() async {
      await db.assets.clear();
      await db.exifInfos.clear();
      await db.albums.clear();
      await db.eTags.clear();
      await db.users.clear();
    });
  }
}
