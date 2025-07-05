import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/date_time_picker.dart';
import 'package:immich_mobile/widgets/common/location_picker.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:timezone/timezone.dart';

final actionServiceProvider = Provider<ActionService>(
  (ref) => ActionService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(remoteAssetRepositoryProvider),
  ),
);

class ActionService {
  final AssetApiRepository _assetApiRepository;
  final RemoteAssetRepository _remoteAssetRepository;

  const ActionService(
    this._assetApiRepository,
    this._remoteAssetRepository,
  );

  Future<void> shareLink(List<String> remoteIds, BuildContext context) async {
    context.pushRoute(
      SharedLinkEditRoute(
        assetsList: remoteIds,
      ),
    );
  }

  Future<void> favorite(List<String> remoteIds) async {
    await _assetApiRepository.updateFavorite(remoteIds, true);
    await _remoteAssetRepository.updateFavorite(remoteIds, true);
  }

  Future<void> unFavorite(List<String> remoteIds) async {
    await _assetApiRepository.updateFavorite(remoteIds, false);
    await _remoteAssetRepository.updateFavorite(remoteIds, false);
  }

  Future<void> archive(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.archive,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.archive,
    );
  }

  Future<void> unArchive(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.timeline,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.timeline,
    );
  }

  Future<void> moveToLockFolder(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.locked,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.locked,
    );
  }

  Future<void> removeFromLockFolder(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.timeline,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.timeline,
    );
  }

  Future<void> trash(List<String> remoteIds) async {
    await _assetApiRepository.delete(remoteIds, false);
    await _remoteAssetRepository.trash(remoteIds);
  }

  Future<void> delete(List<String> remoteIds) async {
    await _assetApiRepository.delete(remoteIds, true);
    await _remoteAssetRepository.delete(remoteIds);
  }

  Future<bool> editLocation(
    List<String> remoteIds,
    BuildContext context,
  ) async {
    LatLng? initialLatLng;
    if (remoteIds.length == 1) {
      final exif = await _remoteAssetRepository.getExif(remoteIds.first);

      if (exif?.latitude != null && exif?.longitude != null) {
        initialLatLng = LatLng(exif!.latitude!, exif.longitude!);
      }
    }

    final location = await showLocationPicker(
      context: context,
      initialLatLng: initialLatLng,
    );

    if (location == null) {
      return false;
    }

    await _assetApiRepository.updateLocation(
      remoteIds,
      location,
    );
    await _remoteAssetRepository.updateLocation(
      remoteIds,
      location,
    );

    return true;
  }

  Future<bool> editDateTime(
    List<String> remoteIds,
    BuildContext context,
  ) async {
    DateTime? initialDateTime;
    Duration? initialOffset;
    String? initialTimeZone;
    if (remoteIds.length == 1) {
      final asset = await _remoteAssetRepository.getAsset(remoteIds.first);
      final exif = await _remoteAssetRepository.getExif(remoteIds.first);

      initialDateTime = asset?.localDateTime;
      initialTimeZone = exif?.timeZone;
      if (initialDateTime != null && initialTimeZone != null) {
        try {
          final location = getLocation(initialTimeZone);
          initialOffset =
              TZDateTime.from(initialDateTime, location).timeZoneOffset;
        } on LocationNotFoundException {
          RegExp re = RegExp(
            r'^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$',
            caseSensitive: false,
          );
          final m = re.firstMatch(initialTimeZone);
          if (m != null) {
            final offset = Duration(
              hours: int.parse(m.group(1) ?? '0'),
              minutes: int.parse(m.group(2) ?? '0'),
            );
            initialOffset = offset;
          }
        }
      }
    }

    final dateTime = await showDateTimePicker(
      context: context,
      initialDateTime: initialDateTime,
      initialTZ: initialTimeZone,
      initialTZOffset: initialOffset,
    );

    if (dateTime == null) {
      return false;
    }

    await _assetApiRepository.updateDateTime(
      remoteIds,
      dateTime,
    );
    await _remoteAssetRepository.updateDateTime(
      remoteIds,
      dateTime,
    );

    return true;
  }
}
