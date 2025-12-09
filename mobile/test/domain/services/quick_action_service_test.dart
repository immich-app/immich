import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/quick_action.service.dart';
import 'package:immich_mobile/infrastructure/repositories/action_button_order.repository.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

void main() {
  group('QuickActionService', () {
    late QuickActionService service;

    setUp(() {
      // Use repository with default behavior for testing
      service = const QuickActionService(ActionButtonOrderRepository());
    });

    test('buildQuickActionTypes should respect custom order', () {
      final remoteAsset = RemoteAsset(
        id: 'test-id',
        name: 'test.jpg',
        checksum: 'checksum',
        type: AssetType.image,
        ownerId: 'owner-id',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final context = ActionButtonContext(
        asset: remoteAsset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        isStacked: false,
        source: ActionSource.viewer,
      );

      final customOrder = [
        ActionButtonType.archive,
        ActionButtonType.share,
        ActionButtonType.edit,
        ActionButtonType.delete,
      ];

      final types = service.buildQuickActionTypes(context, quickActionOrder: customOrder);

      expect(types.length, lessThanOrEqualTo(ActionButtonBuilder.defaultQuickActionLimit));
      expect(types.first, ActionButtonType.archive);
      expect(types[1], ActionButtonType.share);
    });

    test('buildQuickActionTypes should resolve archive to unarchive when archived', () {
      final remoteAsset = RemoteAsset(
        id: 'test-id',
        name: 'test.jpg',
        checksum: 'checksum',
        type: AssetType.image,
        ownerId: 'owner-id',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final context = ActionButtonContext(
        asset: remoteAsset,
        isOwner: true,
        isArchived: true, // archived
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        isStacked: false,
        source: ActionSource.viewer,
      );

      final customOrder = [ActionButtonType.archive];

      final types = service.buildQuickActionTypes(context, quickActionOrder: customOrder);

      expect(types.contains(ActionButtonType.unarchive), isTrue);
      expect(types.contains(ActionButtonType.archive), isFalse);
    });

    test('buildQuickActionTypes should filter types that shouldShow returns false', () {
      final localAsset = LocalAsset(
        id: 'local-id',
        name: 'test.jpg',
        checksum: 'checksum',
        type: AssetType.image,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final context = ActionButtonContext(
        asset: localAsset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        isStacked: false,
        source: ActionSource.viewer,
      );

      final customOrder = [
        ActionButtonType.archive, // should not show for local-only asset
        ActionButtonType.share,
      ];

      final types = service.buildQuickActionTypes(context, quickActionOrder: customOrder);

      expect(types.contains(ActionButtonType.archive), isFalse);
      expect(types.contains(ActionButtonType.share), isTrue);
    });

    test('buildQuickActionTypes should respect limit', () {
      final remoteAsset = RemoteAsset(
        id: 'test-id',
        name: 'test.jpg',
        checksum: 'checksum',
        type: AssetType.image,
        ownerId: 'owner-id',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final context = ActionButtonContext(
        asset: remoteAsset,
        isOwner: true,
        isArchived: false,
        isTrashEnabled: true,
        isInLockedView: false,
        currentAlbum: null,
        advancedTroubleshooting: false,
        isStacked: false,
        source: ActionSource.viewer,
      );

      final types = service.buildQuickActionTypes(
        context,
        quickActionOrder: ActionButtonBuilder.defaultQuickActionOrder,
        limit: 2,
      );

      expect(types.length, 2);
    });
  });
}
