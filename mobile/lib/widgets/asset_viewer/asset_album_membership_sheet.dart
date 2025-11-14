import 'dart:collection';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

Future<Set<String>?> showAssetAlbumMembershipSheet({
  required BuildContext context,
  required WidgetRef ref,
  required Set<String> initialSelection,
  required bool publicOnly,
}) {
  return showModalBottomSheet<Set<String>>(
    context: context,
    backgroundColor: Theme.of(context).colorScheme.surface,
    isScrollControlled: true,
    builder: (ctx) => _AssetAlbumMembershipSheet(
      initialSelection: initialSelection,
      publicOnly: publicOnly,
    ),
  );
}

class _AssetAlbumMembershipSheet extends HookConsumerWidget {
  const _AssetAlbumMembershipSheet({
    required this.initialSelection,
    required this.publicOnly,
  });

  final Set<String> initialSelection;
  final bool publicOnly;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.watch(currentUserProvider)?.id;
    final remoteAlbumState = ref.watch(remoteAlbumProvider);
    final editableAlbums = remoteAlbumState.albums
        .where((album) => album.ownerId == userId)
        .where((album) => !publicOnly || album.isShared)
        .sortedBy((album) => album.name.toLowerCase());

    useEffect(() {
      if (remoteAlbumState.albums.isEmpty) {
        Future.microtask(() => ref.read(remoteAlbumProvider.notifier).refresh());
      }
      return null;
    }, [remoteAlbumState.albums.length]);

    final selection = useState<Set<String>>(initialSelection.intersection(editableAlbums.map((album) => album.id).toSet()));

    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) {
        if (!didPop) {
          Navigator.of(context).pop(selection.value);
        }
      },
      child: SafeArea(
        child: DraggableScrollableSheet(
          initialChildSize: 0.75,
          minChildSize: 0.4,
          maxChildSize: 0.95,
          expand: false,
          builder: (ctx, controller) {
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          (publicOnly ? 'asset_album_membership_title_public' : 'asset_album_membership_title')
                              .tr(),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).pop(selection.value),
                      ),
                    ],
                  ),
                ),
                if (editableAlbums.isEmpty)
                  Expanded(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          (publicOnly
                                  ? 'asset_album_membership_empty_public'
                                  : 'asset_album_membership_empty_private')
                              .tr(),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: ListView.builder(
                      controller: controller,
                      itemCount: editableAlbums.length,
                      itemBuilder: (ctx, index) {
                        final album = editableAlbums[index];
                        final isSelected = selection.value.contains(album.id);
                        return CheckboxListTile(
                          value: isSelected,
                          onChanged: (checked) {
                            final next = HashSet<String>.from(selection.value);
                            if (checked ?? false) {
                              next.add(album.id);
                            } else {
                              next.remove(album.id);
                            }
                            selection.value = next;
                          },
                          title: Text(album.name),
                          subtitle: album.isShared
                              ? Text('asset_album_membership_public_badge'.tr())
                              : null,
                        );
                      },
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(selection.value),
                      child: Text('asset_album_membership_apply'.tr()),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

Future<void> manageAssetAlbumMembership({
  required BuildContext context,
  required WidgetRef ref,
  required BaseAsset asset,
  required ActionSource source,
  bool publicOnly = false,
}) async {
  final remoteAssetId = switch (asset) {
    RemoteAsset remoteAsset => remoteAsset.id,
    LocalAsset localAsset => localAsset.remoteAssetId,
    _ => null,
  };

  if (remoteAssetId == null) {
    ImmichToast.show(
      context: context,
      toastType: ToastType.error,
      gravity: ToastGravity.BOTTOM,
      msg: 'asset_album_membership_only_remote'.tr(),
    );
    return;
  }

  final albumsFuture = ref.read(albumsContainingAssetProvider(remoteAssetId).future);
  final initialAlbums = await albumsFuture;
  final initialSelection = initialAlbums.map((album) => album.id).toSet();

  final updatedSelection = await showAssetAlbumMembershipSheet(
    context: context,
    ref: ref,
    initialSelection: initialSelection,
    publicOnly: publicOnly,
  );

  if (updatedSelection == null || const SetEquality().equals(initialSelection, updatedSelection)) {
    return;
  }

  final additions = updatedSelection.difference(initialSelection);
  final removals = initialSelection.difference(updatedSelection);

  if (additions.isEmpty && removals.isEmpty) {
    return;
  }

  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (_) => const Center(child: CircularProgressIndicator()),
  );

  bool hadError = false;
  int addedAlbums = 0;
  int removedAlbums = 0;

  for (final albumId in additions) {
    final result = await ref.read(actionProvider.notifier).addToAlbum(source, albumId);
    if (result.success) {
      addedAlbums += 1;
    } else {
      hadError = true;
    }
  }

  for (final albumId in removals) {
    final result = await ref.read(actionProvider.notifier).removeFromAlbum(source, albumId);
    if (result.success) {
      removedAlbums += 1;
    } else {
      hadError = true;
    }
  }

  Navigator.of(context, rootNavigator: true).pop();

  if (addedAlbums > 0) {
    ImmichToast.show(
      context: context,
      msg: 'asset_album_membership_added'.tr(args: {'count': addedAlbums.toString()}),
      gravity: ToastGravity.BOTTOM,
    );
  }

  if (removedAlbums > 0) {
    ImmichToast.show(
      context: context,
      msg: 'asset_album_membership_removed'.tr(args: {'count': removedAlbums.toString()}),
      gravity: ToastGravity.BOTTOM,
    );
  }

  if (hadError) {
    ImmichToast.show(
      context: context,
      msg: 'asset_album_membership_error'.tr(),
      gravity: ToastGravity.BOTTOM,
      toastType: ToastType.error,
    );
  }

  ref.invalidate(albumsContainingAssetProvider(remoteAssetId));
}
