import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

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
  );
}

RemoteAsset createRemoteAsset({
  String? localId,
  String name = 'test.jpg',
  String checksum = 'test-checksum',
  AssetType type = AssetType.image,
  DateTime? createdAt,
  DateTime? updatedAt,
  bool isFavorite = false,
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
    isFavorite: isFavorite,
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
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.download.shouldShow(context), isFalse);
      });
    });

    group('trash button', () {
      test('should show when owner, not locked, has remote, and trash enabled', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.trash.shouldShow(context), isTrue);
      });

      test('should not show when trash disabled', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: false,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.trash.shouldShow(context), isFalse);
      });
    });

    group('deletePermanent button', () {
      test('should show when owner, not locked, has remote, and trash disabled', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: false,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.deletePermanent.shouldShow(context), isTrue);
      });

      test('should not show when trash enabled', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.deletePermanent.shouldShow(context), isFalse);
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
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.moveToLockFolder.shouldShow(context), isTrue);
      });
    });

    group('deleteLocal button', () {
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
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.deleteLocal.shouldShow(context), isTrue);
      });

      test('should not show when asset is not local only', () {
        final remoteAsset = createRemoteAsset();
        final context = ActionButtonContext(
          asset: remoteAsset,
          isOwner: true,
          isArchived: false,
          isTrashEnabled: true,
          isInLockedView: false,
          currentAlbum: null,
          advancedTroubleshooting: false,
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.deleteLocal.shouldShow(context), isFalse);
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
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.removeFromAlbum.shouldShow(context), isFalse);
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
          source: ActionSource.timeline,
        );

        expect(ActionButtonType.advancedInfo.shouldShow(context), isFalse);
      });
    });
  });

  group('ActionButtonType.buildButton', () {
    late BaseAsset asset;
    late ActionButtonContext context;

    setUp(() {
      asset = createLocalAsset(remoteId: 'remote-id');
      context = ActionButtonContext(
        asset: asset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        source: ActionSource.timeline,
      );
    });

    test('should build correct widget for each button type', () {
      for (final buttonType in ActionButtonType.values) {
        if (buttonType == ActionButtonType.removeFromAlbum) {
          final album = createRemoteAlbum();
          final contextWithAlbum = ActionButtonContext(
            asset: asset,
            isOwner: true,
            isArchived: false,
            isTrashEnabled: true,
            isInLockedView: false,
            currentAlbum: album,
            advancedTroubleshooting: false,
            source: ActionSource.timeline,
          );
          final widget = buttonType.buildButton(contextWithAlbum);
          expect(widget, isA<Widget>());
        } else {
          final widget = buttonType.buildButton(context);
          expect(widget, isA<Widget>());
        }
      }
    });
  });

  group('ActionButtonBuilder', () {
    test('should return buttons that should show', () {
      final remoteAsset = createRemoteAsset();
      final context = ActionButtonContext(
        asset: remoteAsset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        source: ActionSource.timeline,
      );

      final widgets = ActionButtonBuilder.build(context);

      expect(widgets, isNotEmpty);
      expect(widgets.length, greaterThan(0));
    });

    test('should include album-specific buttons when album is present', () {
      final remoteAsset = createRemoteAsset();
      final album = createRemoteAlbum(isActivityEnabled: true, isShared: true);
      final context = ActionButtonContext(
        asset: remoteAsset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: album,
        advancedTroubleshooting: false,
        source: ActionSource.timeline,
      );

      final widgets = ActionButtonBuilder.build(context);

      expect(widgets, isNotEmpty);
    });

    test('should only include local buttons for local assets', () {
      final localAsset = createLocalAsset();
      final context = ActionButtonContext(
        asset: localAsset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        source: ActionSource.timeline,
      );

      final widgets = ActionButtonBuilder.build(context);

      expect(widgets, isNotEmpty);
    });

    test('should respect archived state', () {
      final remoteAsset = createRemoteAsset();

      final archivedContext = ActionButtonContext(
        asset: remoteAsset,
        isOwner: true,
        isArchived: true,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        source: ActionSource.timeline,
      );

      final archivedWidgets = ActionButtonBuilder.build(archivedContext);

      final nonArchivedContext = ActionButtonContext(
        asset: remoteAsset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        source: ActionSource.timeline,
      );

      final nonArchivedWidgets = ActionButtonBuilder.build(nonArchivedContext);

      expect(archivedWidgets, isNotEmpty);
      expect(nonArchivedWidgets, isNotEmpty);
    });
  });
}
