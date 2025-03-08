import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/auth.interface.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';

final authRepositoryProvider = Provider<IAuthRepository>(
  (ref) => AuthRepository(ref.watch(dbProvider)),
);

class AuthRepository extends DatabaseRepository implements IAuthRepository {
  AuthRepository(super.db);

  @override
  Future<void> clearLocalData() {
    return db.writeTxn(() {
      return Future.wait([
        db.assets.clear(),
        db.exifInfos.clear(),
        db.albums.clear(),
        db.eTags.clear(),
        db.users.clear(),
      ]);
    });
  }

  @override
  String getAccessToken() {
    return Store.get(StoreKey.accessToken);
  }

  @override
  bool getEndpointSwitchingFeature() {
    return Store.tryGet(StoreKey.autoEndpointSwitching) ?? false;
  }

  @override
  String? getPreferredWifiName() {
    return Store.tryGet(StoreKey.preferredWifiName);
  }

  @override
  String? getLocalEndpoint() {
    return Store.tryGet(StoreKey.localEndpoint);
  }

  @override
  List<AuxilaryEndpoint> getExternalEndpointList() {
    final jsonString = Store.tryGet(StoreKey.externalEndpointList);

    if (jsonString == null) {
      return [];
    }

    final List<dynamic> jsonList = jsonDecode(jsonString);
    final endpointList =
        jsonList.map((e) => AuxilaryEndpoint.fromJson(e)).toList();

    return endpointList;
  }
}
