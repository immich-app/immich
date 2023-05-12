import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/album/ui/album_viewer_appbar.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class AlbumViewerPage extends HookConsumerWidget {
  final int albumId;

  const AlbumViewerPage({Key? key, required this.albumId}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    FocusNode titleFocusNode = useFocusNode();
    final album = ref.watch(sharedAlbumDetailProvider(albumId));
    final settings = ref.watch(appSettingsServiceProvider);
    final userId = ref.watch(authenticationProvider).userId;
    final selection = useState<Set<Asset>>({});
    final multiSelectEnabled = useState(false);

    Future<bool> onWillPop() async {
      if (multiSelectEnabled.value) {
        selection.value = {};
        multiSelectEnabled.value = false;
        return false;
      }

      return true;
    }

    void selectionListener(bool active, Set<Asset> selected) {
      selection.value = selected;
      multiSelectEnabled.value = true;
    }

    void disableSelection() {
      selection.value = {};
      multiSelectEnabled.value = false;
    }

    return Scaffold(
      body: album.when(
        data: (data) => WillPopScope(
          onWillPop: onWillPop,
          child: GestureDetector(
            onTap: () {
              titleFocusNode.unfocus();
            },
            child: NestedScrollView(
              floatHeaderSlivers: true,
              headerSliverBuilder: (context, innerBoxIsScrolled) => [
                AlbumViewerAppbar(
                  titleFocusNode: titleFocusNode,
                  album: data,
                  userId: userId,
                  selected: selection.value,
                  selectionDisabled: disableSelection,
                ),
              ],
              body: ImmichAssetGrid(
                renderList: data.renderList,
                showStorageIndicator:
                    settings.getSetting(AppSettingsEnum.storageIndicator),
                assetsPerRow: settings.getSetting(AppSettingsEnum.tilesPerRow),
                dynamicLayout:
                    settings.getSetting(AppSettingsEnum.dynamicLayout),
                listener: selectionListener,
                selectionActive: multiSelectEnabled.value,
              ),

              //body: ScrollablePositionedList.builder(itemCount: 100, itemBuilder: (_, i) => Text('$i'),),
            ),
          ),
        ),
        error: (e, _) => Center(child: Text("Error loading album info $e")),
        loading: () => const Center(
          child: ImmichLoadingIndicator(),
        ),
      ),
    );
  }
}
