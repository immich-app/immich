import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/providers/asset_selection.provider.dart';
import 'package:immich_mobile/modules/sharing/ui/album_title_text_field.dart';
import 'package:immich_mobile/modules/sharing/ui/shared_album_thumbnail_image.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class CreateSharedAlbumPage extends HookConsumerWidget {
  const CreateSharedAlbumPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumTitleController = useTextEditingController.fromValue(TextEditingValue.empty);
    final albumTitleTextFieldFocusNode = useFocusNode();
    final isAlbumTitleTextFieldFocus = useState(false);
    final isAlbumTitleEmpty = useState(true);
    final selectedAssetsForAlbum = useState<Set<ImmichAsset>>({});

    _submitCreateNewAlbum() {}

    _onSelectPhotosButtonPressed() async {
      Set<ImmichAsset>? selectedAsset =
          await AutoRouter.of(context).push<Set<ImmichAsset>?>(const AssetSelectionRoute());

      if (selectedAsset != null) {
        selectedAssetsForAlbum.value = selectedAsset;
      } else {
        selectedAssetsForAlbum.value = {};
      }
    }

    _buildTitleInputField() {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.only(
            top: 50.0,
            right: 10,
            left: 10,
          ),
          child: AlbumTitleTextField(
              isAlbumTitleEmpty: isAlbumTitleEmpty,
              albumTitleTextFieldFocusNode: albumTitleTextFieldFocusNode,
              albumTitleController: albumTitleController,
              isAlbumTitleTextFieldFocus: isAlbumTitleTextFieldFocus),
        ),
      );
    }

    _buildTitle() {
      if (selectedAssetsForAlbum.value.isEmpty) {
        return const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.only(top: 200, left: 18),
            child: Text(
              'ADD ASSETS',
              style: TextStyle(fontSize: 12),
            ),
          ),
        );
      }

      return const SliverToBoxAdapter();
    }

    _buildSelectPhotosButton() {
      if (selectedAssetsForAlbum.value.isEmpty) {
        return SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(top: 16, left: 18, right: 18),
            child: OutlinedButton.icon(
              style: ButtonStyle(
                alignment: Alignment.centerLeft,
                padding:
                    MaterialStateProperty.all<EdgeInsets>(const EdgeInsets.symmetric(vertical: 22, horizontal: 16)),
              ),
              onPressed: _onSelectPhotosButtonPressed,
              icon: const Icon(Icons.add_rounded),
              label: const Padding(
                padding: EdgeInsets.only(left: 8.0),
                child: Text(
                  'Select assets',
                  style: TextStyle(fontSize: 16, color: Colors.black87, fontWeight: FontWeight.w500),
                ),
              ),
            ),
          ),
        );
      }

      return const SliverToBoxAdapter();
    }

    _buildControlButton() {
      return const SliverToBoxAdapter();
    }

    _buildSharedUserList() {
      return const SliverToBoxAdapter();
    }

    _buildSelectedImageGrid() {
      if (selectedAssetsForAlbum.value.isNotEmpty) {
        var asset = selectedAssetsForAlbum.value.toList();

        return SliverPadding(
          padding: const EdgeInsets.only(top: 32),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 5.0,
              mainAxisSpacing: 5,
            ),
            delegate: SliverChildBuilderDelegate(
              (BuildContext context, int index) {
                return SharedAlbumThumbnailImage(asset: asset[index]);
              },
              childCount: asset.length,
            ),
          ),
        );
      }

      return const SliverToBoxAdapter();
    }

    return Scaffold(
        appBar: AppBar(
          elevation: 0,
          centerTitle: false,
          leading: IconButton(
              onPressed: () {
                ref.watch(assetSelectionProvider.notifier).removeAll();
                AutoRouter.of(context).pop();
              },
              icon: const Icon(Icons.close_rounded)),
          title: const Text('Create album'),
          actions: [
            TextButton(
              onPressed: albumTitleController.text.isNotEmpty ? _submitCreateNewAlbum : null,
              child: const Text(
                'Share',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        body: GestureDetector(
          onTap: () {
            albumTitleTextFieldFocusNode.unfocus();
            isAlbumTitleTextFieldFocus.value = false;

            if (albumTitleController.text.isEmpty) {
              albumTitleController.text = 'Untitled';
            }
          },
          child: CustomScrollView(
            slivers: [
              _buildTitleInputField(),
              _buildTitle(),
              _buildSelectPhotosButton(),

              // Build selected photos grid
              _buildSharedUserList(),
              _buildControlButton(),
              _buildSelectedImageGrid(),
            ],
          ),
        ));
  }
}
