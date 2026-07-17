import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

import '../unit/presentation/presentation_context.dart';

LocalAsset createLocalAsset({
  String? remoteId,
  String name = 'test.jpg',
  String? checksum = 'test-checksum',
  AssetType type = AssetType.image,
  DateTime? createdAt,
  DateTime? updatedAt,
  bool isFavorite = false,
}) {
  return LocalAsset(
    id: 'local-id',
    remoteId: remoteId,
    name: name,
    checksum: checksum,
    type: type,
    createdAt: createdAt ?? DateTime.now(),
    updatedAt: updatedAt ?? DateTime.now(),
    isFavorite: isFavorite,
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
  );
}

RemoteAsset createRemoteAsset({
  String? localId,
  String name = 'test.jpg',
  String checksum = 'test-checksum',
  AssetType type = AssetType.image,
  DateTime? createdAt,
  DateTime? updatedAt,
  DateTime? uploadedAt,
  bool isFavorite = false,
  DateTime? deletedAt,
}) {
  return RemoteAsset(
    id: 'remote-id',
    localId: localId,
    name: name,
    checksum: checksum,
    type: type,
    ownerId: 'owner-id',
    createdAt: createdAt ?? DateTime.now(),
    updatedAt: updatedAt ?? DateTime.now(),
    uploadedAt: uploadedAt ?? DateTime.now(),
    isFavorite: isFavorite,
    isEdited: false,
    deletedAt: deletedAt,
  );
}

RemoteAlbum createRemoteAlbum({
  String id = 'test-album-id',
  String name = 'Test Album',
  bool isActivityEnabled = false,
  bool isShared = false,
}) {
  return RemoteAlbum(
    id: id,
    name: name,
    ownerId: 'owner-id',
    description: 'Test Description',
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    isActivityEnabled: isActivityEnabled,
    isShared: isShared,
    order: AlbumAssetOrder.asc,
    assetCount: 0,
    ownerName: 'Test Owner',
  );
}

ActionButtonContext _buttonContext({
  required BaseAsset asset,
  RemoteAlbum? currentAlbum,
  bool isArchived = false,
  bool isStacked = false,
}) => ActionButtonContext(
  asset: asset,
  isOwner: true,
  isArchived: isArchived,
  isTrashEnabled: true,
  isInLockedView: false,
  currentAlbum: currentAlbum,
  advancedTroubleshooting: false,
  isStacked: isStacked,
  source: ActionSource.timeline,
);

void main() {
  group('ActionButtonContext', () {
    test('should create context with all required parameters', () {
      final asset = createLocalAsset();

      final context = ActionButtonContext(
        asset: asset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        isStacked: false,
        source: ActionSource.timeline,
      );

      expect(context.asset, isA<BaseAsset>());
      expect(context.isOwner, isTrue);
      expect(context.isArchived, isFalse);
      expect(context.isTrashEnabled, isTrue);
      expect(context.isInLockedView, isFalse);
      expect(context.currentAlbum, isNull);
      expect(context.source, ActionSource.timeline);
    });
  });

  group('ActionButtonType.shouldShow', () {
    late BaseAsset mergedAsset;

    setUp(() {
      mergedAsset = createLocalAsset(remoteId: 'remote-id');
    });

    group('share button', () {
      test('should show when not in locked view', () {
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.share.shouldShow(context), isTrue);
      });

      test('should show when in locked view', () {
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: true,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.share.shouldShow(context), isTrue);
      });
    });

    group('shareLink button', () {
      test('should show when not in locked view and asset has remote', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.shareLink.shouldShow(context), isTrue);
      });

      test('should not show when in locked view', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: true,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.shareLink.shouldShow(context), isFalse);
      });

      test('should not show when asset has no remote', () {
        final localAsset = createLocalAsset();
        final context = ActionButtonContext(
          asset: localAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.shareLink.shouldShow(context), isFalse);
      });
    });

    group('archive button', () {
      test('should show when owner, not locked, has remote, and not archived', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.archive.shouldShow(context), isTrue);
      });

      test('should not show when not owner', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: false,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.archive.shouldShow(context), isFalse);
      });

      test('should not show when in locked view', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: true,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.archive.shouldShow(context), isFalse);
      });

      test('should not show when asset has no remote', () {
        final localAsset = createLocalAsset();
        final context = ActionButtonContext(
          asset: localAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.archive.shouldShow(context), isFalse);
      });

      test('should not show when already archived', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: true,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.archive.shouldShow(context), isFalse);
      });
    });

    group('unarchive button', () {
      test('should show when owner, not locked, has remote, and is archived', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: true,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.unarchive.shouldShow(context), isTrue);
      });

      test('should not show when not archived', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.unarchive.shouldShow(context), isFalse);
      });

      test('should not show when not owner', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: false,
          isArchived: true,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.unarchive.shouldShow(context), isFalse);
      });
    });

    group('download button', () {
      test('should show when not locked, has remote, and no local copy', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.download.shouldShow(context), isTrue);
      });

      test('should not show when has local copy', () {
        final mergedAsset = createLocalAsset(remoteId: 'remote-id');
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.download.shouldShow(context), isFalse);
      });

      test('should not show when in locked view', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: true,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.download.shouldShow(context), isFalse);
      });
    });

    group('similar photos button', () {
      test('should show when not locked and has remote', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          isStacked: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.similarPhotos.shouldShow(context), isTrue);
      });

      test('should not show when in locked view', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: true,
          currentAlbum: null,
          isStacked: false,
          advancedTroubleshooting: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.similarPhotos.shouldShow(context), isFalse);
      });
    });

    group('restoreTrash button', () {
      test('should show when owner, not locked, has remote, and is in trash timeline', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
          timelineOrigin: TimelineOrigin.trash,
        );

        expect(ActionButtonType.restoreTrash.shouldShow(context), isTrue);
      });

      test('should not show when not in trash timeline', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: false,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
          timelineOrigin: TimelineOrigin.main,
        );

        expect(ActionButtonType.restoreTrash.shouldShow(context), isFalse);
      });
    });

    group('delete button', () {
      test('should show when owner, not locked, and has remote', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.delete.shouldShow(context), isTrue);
      });
    });

    group('moveToLockFolder button', () {
      test('should show when owner, not locked, and has remote', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.moveToLockFolder.shouldShow(context), isTrue);
      });
    });

    group('deleteLocal button', () {
      test('should not show when asset is local only', () {
        final localAsset = createLocalAsset();
        final context = ActionButtonContext(
          asset: localAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.deleteLocal.shouldShow(context), isFalse);
      });

      test('should show when asset is merged', () {
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.deleteLocal.shouldShow(context), isTrue);
      });
    });

    group('upload button', () {
      test('should show when not locked and asset is local only', () {
        final localAsset = createLocalAsset();
        final context = ActionButtonContext(
          asset: localAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.upload.shouldShow(context), isTrue);
      });
    });

    group('removeFromAlbum button', () {
      test('should show when owner, not locked, and has current album', () {
        final album = createRemoteAlbum();
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: album,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.removeFromAlbum.shouldShow(context), isTrue);
      });

      test('should not show when no current album', () {
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.removeFromAlbum.shouldShow(context), isFalse);
      });
    });

    group('setProfilePicture button', () {
      test('should show when owner, not locked, and asset is RemoteAsset', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.setProfilePicture.shouldShow(context), isTrue);
      });

      test('should not show when not owner', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: false,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.setProfilePicture.shouldShow(context), isFalse);
      });

      test('should not show when in locked view', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: true,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.setProfilePicture.shouldShow(context), isFalse);
      });

      test('should not show when asset is not RemoteAsset', () {
        final localAsset = createLocalAsset();
        final context = ActionButtonContext(
          asset: localAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.setProfilePicture.shouldShow(context), isFalse);
      });
    });

    group('setAlbumCover button', () {
      test('should show when owner, not locked, has album, and selectedCount is 1', () {
        final album = createRemoteAlbum();
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: album,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
          selectedCount: 1,
        );

        expect(ActionButtonType.setAlbumCover.shouldShow(context), isTrue);
      });

      test('should show when not owner', () {
        final album = createRemoteAlbum();
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: false,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: album,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
          selectedCount: 1,
        );

        expect(ActionButtonType.setAlbumCover.shouldShow(context), isTrue);
      });

      test('should not show when in locked view', () {
        final album = createRemoteAlbum();
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: true,
          currentAlbum: album,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
          selectedCount: 1,
        );

        expect(ActionButtonType.setAlbumCover.shouldShow(context), isFalse);
      });

      test('should not show when no current album', () {
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
          selectedCount: 1,
        );

        expect(ActionButtonType.setAlbumCover.shouldShow(context), isFalse);
      });

      test('should not show when selectedCount is not 1', () {
        final album = createRemoteAlbum();
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: album,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
          selectedCount: 0,
        );

        expect(ActionButtonType.setAlbumCover.shouldShow(context), isFalse);
      });

      test('should not show when selectedCount is greater than 1', () {
        final album = createRemoteAlbum();
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: album,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
          selectedCount: 2,
        );

        expect(ActionButtonType.setAlbumCover.shouldShow(context), isFalse);
      });
    });

    group('likeActivity button', () {
      test('should show when not locked, has album, activity enabled, and shared', () {
        final album = createRemoteAlbum(isActivityEnabled: true, isShared: true);
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: album,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.likeActivity.shouldShow(context), isTrue);
      });

      test('should not show when activity not enabled', () {
        final album = createRemoteAlbum(isActivityEnabled: false, isShared: true);
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: album,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.likeActivity.shouldShow(context), isFalse);
      });

      test('should not show when album not shared', () {
        final album = createRemoteAlbum(isActivityEnabled: true, isShared: false);
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: album,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.likeActivity.shouldShow(context), isFalse);
      });

      test('should not show when no album', () {
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.likeActivity.shouldShow(context), isFalse);
      });
    });

    group('advancedTroubleshooting button', () {
      test('should show when in advanced troubleshooting mode', () {
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: true,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.advancedInfo.shouldShow(context), isTrue);
      });

      test('should not show when not in advanced troubleshooting mode', () {
        final context = ActionButtonContext(
          asset: mergedAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          isStacked: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.advancedInfo.shouldShow(context), isFalse);
      });
    });
  });

  group('unstack button', () {
    test('should show when owner, not locked, has remote, and is stacked', () {
      final remoteAsset = createRemoteAsset();
      final context = ActionButtonContext(
        asset: remoteAsset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        isStacked: true,
        source: ActionSource.timeline,
      );

      expect(ActionButtonType.unstack.shouldShow(context), isTrue);
    });

    test('should not show when not stacked', () {
      final remoteAsset = createRemoteAsset();
      final context = ActionButtonContext(
        asset: remoteAsset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        isStacked: false,
        source: ActionSource.timeline,
      );

      expect(ActionButtonType.unstack.shouldShow(context), isFalse);
    });

    test('should not show when not owner', () {
      final remoteAsset = createRemoteAsset();
      final context = ActionButtonContext(
        asset: remoteAsset,
        isOwner: false,
        isArchived: true,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        isStacked: false,
        source: ActionSource.timeline,
      );

      expect(ActionButtonType.unstack.shouldShow(context), isFalse);
    });
  });

  group('ActionButtonType.buildButton', () {
    late PresentationContext presentation;
    late BaseAsset asset;

    setUp(() async {
      presentation = await PresentationContext.create();
      asset = createLocalAsset(remoteId: 'remote-id');
    });

    tearDown(() {
      presentation.dispose();
    });

    testWidgets('builds a widget for every button type', (tester) async {
      final built = <Widget>[];
      await tester.pumpTestWidget(
        presentation,
        Consumer(
          builder: (buildContext, ref, _) {
            for (final buttonType in ActionButtonType.values) {
              final buttonContext = switch (buttonType) {
                ActionButtonType.similarPhotos => _buttonContext(asset: createRemoteAsset()),
                ActionButtonType.removeFromAlbum ||
                ActionButtonType.setAlbumCover => _buttonContext(asset: asset, currentAlbum: createRemoteAlbum()),
                ActionButtonType.unstack => _buttonContext(
                  asset: asset,
                  currentAlbum: createRemoteAlbum(),
                  isStacked: true,
                ),
                _ => _buttonContext(asset: asset),
              };
              built.add(buttonType.buildButton(buttonContext, buildContext));
            }
            return const SizedBox.shrink();
          },
        ),
      );

      expect(built, hasLength(ActionButtonType.values.length));
      expect(built, everyElement(isA<Widget>()));
    });
  });

  group('ActionButtonBuilder', () {
    late PresentationContext presentation;

    setUp(() async {
      presentation = await PresentationContext.create();
    });

    tearDown(() {
      presentation.dispose();
    });

    Future<List<Widget>> buildButtons(WidgetTester tester, ActionButtonContext context) async {
      late List<Widget> widgets;
      await tester.pumpTestWidget(
        presentation,
        Consumer(
          builder: (buildContext, ref, _) {
            widgets = ActionButtonBuilder.build(context, buildContext);
            return const SizedBox.shrink();
          },
        ),
      );
      return widgets;
    }

    testWidgets('returns buttons that should show', (tester) async {
      final widgets = await buildButtons(tester, _buttonContext(asset: createRemoteAsset()));
      expect(widgets, isNotEmpty);
    });

    testWidgets('includes album-specific buttons when album is present', (tester) async {
      final widgets = await buildButtons(
        tester,
        _buttonContext(
          asset: createRemoteAsset(),
          currentAlbum: createRemoteAlbum(isActivityEnabled: true, isShared: true),
        ),
      );
      expect(widgets, isNotEmpty);
    });

    testWidgets('includes local buttons for local assets', (tester) async {
      final widgets = await buildButtons(tester, _buttonContext(asset: createLocalAsset()));
      expect(widgets, isNotEmpty);
    });

    testWidgets('respects archived state', (tester) async {
      final remoteAsset = createRemoteAsset();
      final archived = await buildButtons(tester, _buttonContext(asset: remoteAsset, isArchived: true));
      final nonArchived = await buildButtons(tester, _buttonContext(asset: remoteAsset, isArchived: false));

      expect(archived, isNotEmpty);
      expect(nonArchived, isNotEmpty);
    });
  });
}
