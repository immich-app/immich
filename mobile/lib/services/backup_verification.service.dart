import 'dart:async';
import 'dart:typed_data';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:isar/isar.dart';
import 'package:photo_manager/photo_manager.dart' show PhotoManager;

/// Finds duplicates originating from missing EXIF information
class BackupVerificationService {
  final Isar _db;

  BackupVerificationService(this._db);

  /// Returns at most [limit] assets that were backed up without exif
  Future<List<Asset>> findWronglyBackedUpAssets({int limit = 100}) async {
    final owner = Store.get(StoreKey.currentUser).isarId;
    final List<Asset> onlyLocal = await _db.assets
        .where()
        .remoteIdIsNull()
        .filter()
        .ownerIdEqualTo(owner)
        .localIdIsNotNull()
        .findAll();
    final List<Asset> remoteMatches = await _getMatches(
      _db.assets.where().localIdIsNull().filter().remoteIdIsNotNull(),
      owner,
      onlyLocal,
      limit,
    );
    final List<Asset> localMatches = await _getMatches(
      _db.assets.where().remoteIdIsNull().filter().localIdIsNotNull(),
      owner,
      remoteMatches,
      limit,
    );

    final List<Asset> deleteCandidates = [], originals = [];

    await diffSortedLists(
      remoteMatches,
      localMatches,
      compare: (a, b) => a.fileName.compareTo(b.fileName),
      both: (a, b) async {
        a.exifInfo = await _db.exifInfos.get(a.id);
        deleteCandidates.add(a);
        originals.add(b);
        return false;
      },
      onlyFirst: (a) {},
      onlySecond: (b) {},
    );
    final isolateToken = ServicesBinding.rootIsolateToken!;
    final List<Asset> toDelete;
    if (deleteCandidates.length > 10) {
      // performs 2 checks in parallel for a nice speedup
      final half = deleteCandidates.length ~/ 2;
      final lower = compute(
        _computeSaveToDelete,
        (
          deleteCandidates: deleteCandidates.slice(0, half),
          originals: originals.slice(0, half),
          auth: Store.get(StoreKey.accessToken),
          endpoint: Store.get(StoreKey.serverEndpoint),
          rootIsolateToken: isolateToken,
        ),
      );
      final upper = compute(
        _computeSaveToDelete,
        (
          deleteCandidates: deleteCandidates.slice(half),
          originals: originals.slice(half),
          auth: Store.get(StoreKey.accessToken),
          endpoint: Store.get(StoreKey.serverEndpoint),
          rootIsolateToken: isolateToken,
        ),
      );
      toDelete = await lower + await upper;
    } else {
      toDelete = await compute(
        _computeSaveToDelete,
        (
          deleteCandidates: deleteCandidates,
          originals: originals,
          auth: Store.get(StoreKey.accessToken),
          endpoint: Store.get(StoreKey.serverEndpoint),
          rootIsolateToken: isolateToken,
        ),
      );
    }
    return toDelete;
  }

  static Future<List<Asset>> _computeSaveToDelete(
    ({
      List<Asset> deleteCandidates,
      List<Asset> originals,
      String auth,
      String endpoint,
      RootIsolateToken rootIsolateToken,
    }) tuple,
  ) async {
    assert(tuple.deleteCandidates.length == tuple.originals.length);
    final List<Asset> result = [];
    BackgroundIsolateBinaryMessenger.ensureInitialized(tuple.rootIsolateToken);
    await PhotoManager.setIgnorePermissionCheck(true);
    final ApiService apiService = ApiService();
    apiService.setEndpoint(tuple.endpoint);
    apiService.setAccessToken(tuple.auth);
    for (int i = 0; i < tuple.deleteCandidates.length; i++) {
      if (await _compareAssets(
        tuple.deleteCandidates[i],
        tuple.originals[i],
        apiService,
      )) {
        result.add(tuple.deleteCandidates[i]);
      }
    }
    return result;
  }

  static Future<bool> _compareAssets(
    Asset remote,
    Asset local,
    ApiService apiService,
  ) async {
    if (remote.checksum == local.checksum) return false;
    ExifInfo? exif = remote.exifInfo;
    if (exif != null && exif.lat != null) return false;
    if (exif == null || exif.fileSize == null) {
      final dto = await apiService.assetApi.getAssetInfo(remote.remoteId!);
      if (dto != null && dto.exifInfo != null) {
        exif = ExifInfo.fromDto(dto.exifInfo!);
      }
    }
    final file = await local.local!.originFile;
    if (exif != null && file != null && exif.fileSize != null) {
      final origSize = await file.length();
      if (exif.fileSize! == origSize || exif.fileSize! != origSize) {
        final latLng = await local.local!.latlngAsync();

        if (exif.lat == null &&
            latLng.latitude != null &&
            (remote.fileCreatedAt.isAtSameMomentAs(local.fileCreatedAt) ||
                remote.fileModifiedAt.isAtSameMomentAs(local.fileModifiedAt) ||
                _sameExceptTimeZone(
                  remote.fileCreatedAt,
                  local.fileCreatedAt,
                ))) {
          if (remote.type == AssetType.video) {
            // it's very unlikely that a video of same length, filesize, name
            // and date is wrong match. Cannot easily compare videos anyway
            return true;
          }

          // for images: make sure they are pixel-wise identical
          // (skip first few KBs containing metadata)
          final Uint64List localImage =
              _fakeDecodeImg(local, await file.readAsBytes());
          final res = await apiService.downloadApi
              .downloadFileWithHttpInfo(remote.remoteId!);
          final Uint64List remoteImage = _fakeDecodeImg(remote, res.bodyBytes);

          final eq = const ListEquality().equals(remoteImage, localImage);
          return eq;
        }
      }
    }

    return false;
  }

  static Uint64List _fakeDecodeImg(Asset asset, Uint8List bytes) {
    const headerLength = 131072; // assume header is at most 128 KB
    final start = bytes.length < headerLength * 2
        ? (bytes.length ~/ (4 * 8)) * 8
        : headerLength;
    return bytes.buffer.asUint64List(start);
  }

  static Future<List<Asset>> _getMatches(
    QueryBuilder<Asset, Asset, QAfterFilterCondition> query,
    int ownerId,
    List<Asset> assets,
    int limit,
  ) =>
      query
          .ownerIdEqualTo(ownerId)
          .anyOf(
            assets,
            (q, Asset a) => q
                .fileNameEqualTo(a.fileName)
                .and()
                .durationInSecondsEqualTo(a.durationInSeconds)
                .and()
                .fileCreatedAtBetween(
                  a.fileCreatedAt.subtract(const Duration(hours: 12)),
                  a.fileCreatedAt.add(const Duration(hours: 12)),
                )
                .and()
                .not()
                .checksumEqualTo(a.checksum),
          )
          .sortByFileName()
          .thenByFileCreatedAt()
          .thenByFileModifiedAt()
          .limit(limit)
          .findAll();

  static bool _sameExceptTimeZone(DateTime a, DateTime b) {
    final ms = a.isAfter(b)
        ? a.millisecondsSinceEpoch - b.millisecondsSinceEpoch
        : b.millisecondsSinceEpoch - a.microsecondsSinceEpoch;
    final x = ms / (1000 * 60 * 30);
    final y = ms ~/ (1000 * 60 * 30);
    return y.toDouble() == x && y < 24;
  }
}

final backupVerificationServiceProvider = Provider(
  (ref) => BackupVerificationService(
    ref.watch(dbProvider),
  ),
);
