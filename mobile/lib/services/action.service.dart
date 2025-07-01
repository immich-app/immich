import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/exif.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/exif.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/location_picker.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final actionServiceProvider = Provider<ActionService>(
  (ref) => ActionService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(remoteAssetRepository),
    ref.watch(remoteExifRepository),
  ),
);

class ActionService {
  final AssetApiRepository _assetApiRepository;
  final DriftRemoteAssetRepository _remoteAssetRepository;
  final DriftRemoteExifRepository _remoteExifRepository;

  const ActionService(
    this._assetApiRepository,
    this._remoteAssetRepository,
    this._remoteExifRepository,
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

  Future<void> editLocation(
    List<String> remoteIds,
    BuildContext context,
  ) async {
    LatLng? initialLatLng;
    if (remoteIds.length == 1) {
      final exif = await _remoteExifRepository.get(remoteIds[0]);

      if (exif?.latitude != null && exif?.longitude != null) {
        initialLatLng = LatLng(exif!.latitude!, exif.longitude!);
      }
    }

    final location = await showLocationPicker(
      context: context,
      initialLatLng: initialLatLng,
    );

    if (location == null) {
      return;
    }

    await _assetApiRepository.updateLocation(
      remoteIds,
      location,
    );
    await _remoteAssetRepository.updateLocation(
      remoteIds,
      location,
    );
  }
}
