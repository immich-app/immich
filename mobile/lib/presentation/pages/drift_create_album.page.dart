import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/album/album_action_filled_button.dart';

@RoutePage()
class DriftCreateAlbumPage extends ConsumerStatefulWidget {
  const DriftCreateAlbumPage({super.key});

  @override
  ConsumerState<DriftCreateAlbumPage> createState() =>
      _DriftCreateAlbumPageState();
}

class _DriftCreateAlbumPageState extends ConsumerState<DriftCreateAlbumPage> {
  TextEditingController albumTitleController = TextEditingController();
  TextEditingController albumDescriptionController = TextEditingController();
  FocusNode albumTitleTextFieldFocusNode = FocusNode();
  FocusNode albumDescriptionTextFieldFocusNode = FocusNode();
  bool isAlbumTitleTextFieldFocus = false;
  Set<BaseAsset> selectedAssets = {};

  @override
  void dispose() {
    albumTitleController.dispose();
    albumDescriptionController.dispose();
    albumTitleTextFieldFocusNode.dispose();
    albumDescriptionTextFieldFocusNode.dispose();
    super.dispose();
  }

  bool get _canCreateAlbum => albumTitleController.text.isNotEmpty;

  String _getEffectiveTitle() {
    return albumTitleController.text.isNotEmpty
        ? albumTitleController.text
        : 'create_album_page_untitled'.t();
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      backgroundColor: context.scaffoldBackgroundColor,
      elevation: 0,
      automaticallyImplyLeading: false,
      pinned: true,
      snap: false,
      floating: false,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(125.0),
        child: Column(
          children: [
            buildTitleInputField(),
            buildDescriptionInputField(),
            if (selectedAssets.isNotEmpty) buildControlButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    return SliverList(
      delegate: SliverChildListDelegate([
        if (selectedAssets.isEmpty) ...[
          _buildEmptyState(),
          _buildSelectPhotosButton(),
        ] else ...[
          _buildSelectedImageGrid(),
        ],
      ]),
    );
  }

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.only(top: 200.0, left: 18),
      child: Text(
        'create_shared_album_page_share_add_assets',
        style: context.textTheme.labelLarge,
      ).t(),
    );
  }

  Widget _buildSelectPhotosButton() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: FilledButton.icon(
        style: FilledButton.styleFrom(
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.symmetric(
            vertical: 24.0,
            horizontal: 16.0,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(10.0)),
          ),
          backgroundColor: context.colorScheme.surfaceContainerHigh,
        ),
        onPressed: onSelectPhotos,
        icon: Icon(Icons.add_rounded, color: context.primaryColor),
        label: Padding(
          padding: const EdgeInsets.only(
            left: 8.0,
          ),
          child: Text(
            'create_shared_album_page_share_select_photos',
            style: context.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.primaryColor,
            ),
          ).t(),
        ),
      ),
    );
  }

  Widget _buildSelectedImageGrid() {
    return Padding(
      padding: const EdgeInsets.only(top: 16.0),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          crossAxisSpacing: 1.0,
          mainAxisSpacing: 1.0,
        ),
        itemCount: selectedAssets.length,
        itemBuilder: (context, index) {
          final asset = selectedAssets.elementAt(index);
          return GestureDetector(
            onTap: onBackgroundTapped,
            child: Thumbnail(asset: asset),
          );
        },
      ),
    );
  }

  void onBackgroundTapped() {
    albumTitleTextFieldFocusNode.unfocus();
    albumDescriptionTextFieldFocusNode.unfocus();
    setState(() {
      isAlbumTitleTextFieldFocus = false;
    });

    if (albumTitleController.text.isEmpty) {
      final untitledText = 'create_album_page_untitled'.t();
      albumTitleController.text = untitledText;
    }
  }

  Future<void> onSelectPhotos() async {
    final assets = await context.pushRoute<Set<BaseAsset>>(
      DriftAssetSelectionTimelineRoute(
        lockedSelectionAssets: selectedAssets,
      ),
    );

    if (assets == null || assets.isEmpty) {
      return;
    }

    setState(() {
      selectedAssets = selectedAssets.union(assets);
    });
  }

  Future<void> createAlbum() async {
    onBackgroundTapped();

    final title = _getEffectiveTitle().trim();
    if (title.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('create_album_title_required'.t()),
            backgroundColor: context.colorScheme.error,
          ),
        );
      }
      return;
    }

    final album = await ref.watch(remoteAlbumProvider.notifier).createAlbum(
          title: title,
          description: albumDescriptionController.text.trim(),
          assetIds: selectedAssets.map((asset) {
            final remoteAsset = asset as RemoteAsset;
            return remoteAsset.id;
          }).toList(),
        );

    if (album != null) {
      context.replaceRoute(
        RemoteTimelineRoute(albumId: album.id),
      );
    }
  }

  Widget buildTitleInputField() {
    return Padding(
      padding: const EdgeInsets.only(
        right: 10.0,
        left: 10.0,
      ),
      child: _AlbumTitleTextField(
        albumTitleTextFieldFocusNode: albumTitleTextFieldFocusNode,
        albumTitleController: albumTitleController,
        isAlbumTitleTextFieldFocus: isAlbumTitleTextFieldFocus,
        onFocusChanged: (focus) {
          setState(() {
            isAlbumTitleTextFieldFocus = focus;
          });
        },
      ),
    );
  }

  Widget buildDescriptionInputField() {
    return Padding(
      padding: const EdgeInsets.only(
        right: 10.0,
        left: 10.0,
      ),
      child: _AlbumViewerEditableDescription(
        albumDescriptionController: albumDescriptionController,
        descriptionFocusNode: albumDescriptionTextFieldFocusNode,
      ),
    );
  }

  Widget buildControlButton() {
    return Padding(
      padding: const EdgeInsets.only(
        left: 12.0,
        top: 16.0,
        bottom: 16.0,
      ),
      child: SizedBox(
        height: 42.0,
        child: ListView(
          scrollDirection: Axis.horizontal,
          children: [
            AlbumActionFilledButton(
              iconData: Icons.add_photo_alternate_outlined,
              onPressed: onSelectPhotos,
              labelText: "add_photos".t(),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        centerTitle: false,
        backgroundColor: context.scaffoldBackgroundColor,
        leading: IconButton(
          onPressed: () => context.maybePop(),
          icon: const Icon(Icons.close_rounded),
        ),
        title: const Text('create_album').t(),
        actions: [
          TextButton(
            onPressed: _canCreateAlbum ? createAlbum : null,
            child: Text(
              'create'.t(),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: _canCreateAlbum
                    ? context.primaryColor
                    : context.themeData.disabledColor,
              ),
            ),
          ),
        ],
      ),
      body: GestureDetector(
        onTap: onBackgroundTapped,
        child: CustomScrollView(
          slivers: [
            _buildSliverAppBar(),
            _buildContent(),
          ],
        ),
      ),
    );
  }
}

class _AlbumTitleTextField extends StatefulWidget {
  const _AlbumTitleTextField({
    required this.albumTitleTextFieldFocusNode,
    required this.albumTitleController,
    required this.isAlbumTitleTextFieldFocus,
    required this.onFocusChanged,
  });

  final FocusNode albumTitleTextFieldFocusNode;
  final TextEditingController albumTitleController;
  final bool isAlbumTitleTextFieldFocus;
  final ValueChanged<bool> onFocusChanged;

  @override
  State<_AlbumTitleTextField> createState() => _AlbumTitleTextFieldState();
}

class _AlbumTitleTextFieldState extends State<_AlbumTitleTextField> {
  @override
  void initState() {
    super.initState();
    widget.albumTitleTextFieldFocusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    widget.albumTitleTextFieldFocusNode.removeListener(_onFocusChange);
    super.dispose();
  }

  void _onFocusChange() {
    widget.onFocusChanged(widget.albumTitleTextFieldFocusNode.hasFocus);
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      onChanged: (v) {
        // No longer need to track empty state separately
        // The controller itself maintains the text state
      },
      focusNode: widget.albumTitleTextFieldFocusNode,
      style: TextStyle(
        fontSize: 28.0,
        color: context.colorScheme.onSurface,
        fontWeight: FontWeight.bold,
      ),
      controller: widget.albumTitleController,
      onTap: () {
        if (widget.albumTitleController.text == 'Untitled') {
          widget.albumTitleController.clear();
        }
      },
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.all(8.0),
        suffixIcon: widget.albumTitleController.text.isNotEmpty &&
                widget.isAlbumTitleTextFieldFocus
            ? IconButton(
                onPressed: () {
                  widget.albumTitleController.clear();
                },
                icon: Icon(
                  Icons.cancel_rounded,
                  color: context.primaryColor,
                ),
                splashRadius: 10.0,
              )
            : null,
        enabledBorder: const OutlineInputBorder(
          borderSide: BorderSide(color: Colors.transparent),
          borderRadius: BorderRadius.all(
            Radius.circular(10.0),
          ),
        ),
        focusedBorder: const OutlineInputBorder(
          borderSide: BorderSide(color: Colors.transparent),
          borderRadius: BorderRadius.all(
            Radius.circular(10.0),
          ),
        ),
        hintText: 'add_a_title'.t(),
        hintStyle: context.themeData.inputDecorationTheme.hintStyle?.copyWith(
          fontSize: 28.0,
          fontWeight: FontWeight.bold,
        ),
        focusColor: Colors.grey[300],
        fillColor: context.colorScheme.surfaceContainerHigh,
        filled: widget.isAlbumTitleTextFieldFocus,
      ),
    );
  }
}

class _AlbumViewerEditableDescription extends StatefulWidget {
  const _AlbumViewerEditableDescription({
    required this.albumDescriptionController,
    required this.descriptionFocusNode,
  });

  final TextEditingController albumDescriptionController;
  final FocusNode descriptionFocusNode;

  @override
  State<_AlbumViewerEditableDescription> createState() =>
      _AlbumViewerEditableDescriptionState();
}

class _AlbumViewerEditableDescriptionState
    extends State<_AlbumViewerEditableDescription> {
  @override
  void initState() {
    super.initState();
    widget.descriptionFocusNode.addListener(_onFocusModeChange);
  }

  @override
  void dispose() {
    widget.descriptionFocusNode.removeListener(_onFocusModeChange);
    super.dispose();
  }

  void _onFocusModeChange() {
    if (!widget.descriptionFocusNode.hasFocus &&
        widget.albumDescriptionController.text.isEmpty) {
      widget.albumDescriptionController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: TextField(
        focusNode: widget.descriptionFocusNode,
        style: context.textTheme.bodyLarge,
        maxLines: 3,
        minLines: 1,
        controller: widget.albumDescriptionController,
        onTap: () {
          context.focusScope.requestFocus(widget.descriptionFocusNode);

          if (widget.albumDescriptionController.text == '') {
            widget.albumDescriptionController.clear();
          }
        },
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.all(8.0),
          suffixIcon: widget.descriptionFocusNode.hasFocus
              ? IconButton(
                  onPressed: () {
                    widget.albumDescriptionController.clear();
                  },
                  icon: Icon(
                    Icons.cancel_rounded,
                    color: context.primaryColor,
                  ),
                  splashRadius: 10.0,
                )
              : null,
          enabledBorder: const OutlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(
              color: context.colorScheme.outline.withValues(alpha: 0.3),
            ),
            borderRadius: const BorderRadius.all(
              Radius.circular(16.0),
            ),
          ),
          focusColor: Colors.grey[300],
          fillColor: context.scaffoldBackgroundColor,
          filled: widget.descriptionFocusNode.hasFocus,
          hintText: 'add_a_description'.t(),
        ),
      ),
    );
  }
}
