import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/providers/shared_album.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/immich_sliver_persistent_app_bar_delegate.dart';
import 'package:intl/intl.dart';

class AlbumViewerPage extends HookConsumerWidget {
  final String albumId;

  const AlbumViewerPage({Key? key, required this.albumId}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AsyncValue<SharedAlbum> _albumInfo = ref.watch(sharedAlbumDetailProvider(albumId));

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

    _buildImageGrid(SharedAlbum albumInfo) {
      if (albumInfo.sharedAssets != null && albumInfo.sharedAssets!.isNotEmpty) {
        return const SliverToBoxAdapter(
          child: Text("asset list"),
        );
      }
      return const SliverToBoxAdapter();
    }

    _buildBody(SharedAlbum albumInfo) {
      return CustomScrollView(
        slivers: [
          _buildHeader(albumInfo),
          SliverPersistentHeader(
            pinned: true,
            delegate: ImmichSliverPersistentAppBarDelegate(
              minHeight: 40,
              maxHeight: 70,
              child: Container(
                color: Colors.indigo,
                child: const Center(
                  child: Text("Control buttons"),
                ),
              ),
            ),
          ),
          _buildImageGrid(albumInfo)
        ],
      );
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
