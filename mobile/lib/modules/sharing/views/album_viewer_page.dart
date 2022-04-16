import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/modules/home/ui/draggable_scrollbar.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/providers/asset_selection.provider.dart';
import 'package:immich_mobile/modules/sharing/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/sharing/ui/album_action_outlined_button.dart';
import 'package:immich_mobile/modules/sharing/ui/album_viewer_thumbnail.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/immich_sliver_persistent_app_bar_delegate.dart';
import 'package:intl/intl.dart';

class AlbumViewerPage extends HookConsumerWidget {
  final String albumId;

  const AlbumViewerPage({Key? key, required this.albumId}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ScrollController _scrollController = useScrollController();
    AsyncValue<SharedAlbum> _albumInfo = ref.watch(sharedAlbumDetailProvider(albumId));

    void _onAddPhotosPressed() {
      AutoRouter.of(context).push(const AssetSelectionRoute());
      ref.watch(assetSelectionProvider.notifier);
    }

    void _onAddUsersPressed() {}

    Widget _buildTitle(String title) {
      return Padding(
        padding: const EdgeInsets.only(left: 16.0, top: 16),
        child: Text(
          title,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget _buildAlbumDateRange(SharedAlbum albumInfo) {
      if (albumInfo.sharedAssets != null && albumInfo.sharedAssets!.isNotEmpty) {
        String startDate = "";
        DateTime parsedStartDate = DateTime.parse(albumInfo.sharedAssets!.first.assetInfo.createdAt);
        DateTime parsedEndDate = DateTime.parse(albumInfo.sharedAssets!.last.assetInfo.createdAt);

        if (parsedStartDate.year == parsedEndDate.year) {
          startDate = DateFormat('LLL d').format(parsedStartDate);
        } else {
          startDate = DateFormat('LLL d, y').format(parsedStartDate);
        }

        String endDate = DateFormat('LLL d, y').format(parsedEndDate);

        return Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 8),
          child: Text(
            "$startDate-$endDate",
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
        );
      } else {
        return Container();
      }
    }

    Widget _buildHeader(SharedAlbum albumInfo) {
      return SliverToBoxAdapter(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTitle(albumInfo.albumName),
            _buildAlbumDateRange(albumInfo),
            SizedBox(
              height: 60,
              child: ListView.builder(
                padding: const EdgeInsets.only(left: 16),
                scrollDirection: Axis.horizontal,
                itemBuilder: ((context, index) {
                  return const Padding(
                    padding: EdgeInsets.only(right: 8.0),
                    child: CircleAvatar(
                      radius: 15,
                      child: Text(
                        'TU',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  );
                }),
                itemCount: albumInfo.sharedUsers.length,
              ),
            )
          ],
        ),
      );
    }

    Widget _buildImageGrid(SharedAlbum albumInfo) {
      if (albumInfo.sharedAssets != null && albumInfo.sharedAssets!.isNotEmpty) {
        return SliverPadding(
          padding: const EdgeInsets.only(top: 10.0),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 5.0,
              mainAxisSpacing: 5,
            ),
            delegate: SliverChildBuilderDelegate(
              (BuildContext context, int index) {
                return AlbumViewerThumbnail(asset: albumInfo.sharedAssets![index].assetInfo);
              },
              childCount: albumInfo.sharedAssets?.length,
            ),
          ),
        );
      }
      return const SliverToBoxAdapter();
    }

    Widget _buildControlButton() {
      return Padding(
        padding: const EdgeInsets.only(left: 16.0, top: 8, bottom: 8),
        child: SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              AlbumActionOutlinedButton(
                iconData: Icons.add_photo_alternate_outlined,
                onPressed: () => _onAddPhotosPressed(),
                labelText: "Add photos",
              ),
              AlbumActionOutlinedButton(
                iconData: Icons.person_add_alt_rounded,
                onPressed: () => _onAddUsersPressed(),
                labelText: "Add users",
              ),
            ],
          ),
        ),
      );
    }

    Widget _buildBody(SharedAlbum albumInfo) {
      return Stack(children: [
        DraggableScrollbar.semicircle(
          backgroundColor: Theme.of(context).primaryColor,
          controller: _scrollController,
          heightScrollThumb: 48.0,
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              _buildHeader(albumInfo),
              SliverPersistentHeader(
                pinned: true,
                delegate: ImmichSliverPersistentAppBarDelegate(
                  minHeight: 50,
                  maxHeight: 50,
                  child: Container(
                    color: immichBackgroundColor,
                    child: _buildControlButton(),
                  ),
                ),
              ),
              _buildImageGrid(albumInfo)
            ],
          ),
        ),
      ]);
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        actions: [
          IconButton(
            splashRadius: 25,
            onPressed: () {},
            icon: const Icon(Icons.more_horiz_rounded),
          ),
        ],
      ),
      body: _albumInfo.when(
        data: (albumInfo) => _buildBody(albumInfo),
        error: (e, _) => Center(child: Text("Error loading album info $e")),
        loading: () => const Center(
          child: ImmichLoadingIndicator(),
        ),
      ),
    );
  }
}
