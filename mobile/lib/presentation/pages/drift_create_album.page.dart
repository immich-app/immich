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
  late TextEditingController albumTitleController;
  late FocusNode albumTitleTextFieldFocusNode;
  late FocusNode albumDescriptionTextFieldFocusNode;
  bool isAlbumTitleTextFieldFocus = false;
  Set<BaseAsset> selectedAssets = {};
  String albumDescription = '';

  @override
  void initState() {
    super.initState();
    albumTitleController = TextEditingController();
    albumTitleTextFieldFocusNode = FocusNode();
    albumDescriptionTextFieldFocusNode = FocusNode();
  }

  @override
  void dispose() {
    albumTitleController.dispose();
    albumTitleTextFieldFocusNode.dispose();
    albumDescriptionTextFieldFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context),
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

  bool _canCreateAlbum() {
    return albumTitleController.text.isNotEmpty;
  }

  String _getEffectiveTitle() {
    return albumTitleController.text.isNotEmpty
        ? albumTitleController.text
        : 'create_album_page_untitled'.t();
  }

  AppBar _buildAppBar(BuildContext context) {
    return AppBar(
      elevation: 0,
      centerTitle: false,
      backgroundColor: context.scaffoldBackgroundColor,
      leading: IconButton(
        onPressed: () {
          setState(() {
            selectedAssets = {};
          });
          context.maybePop();
        },
        icon: const Icon(Icons.close_rounded),
      ),
      title: const Text('create_album').t(context: context),
      actions: [
        TextButton(
          onPressed: _canCreateAlbum() ? createAlbum : null,
          child: Text(
            'create'.t(),
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: _canCreateAlbum()
                  ? context.primaryColor
                  : context.themeData.disabledColor,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      backgroundColor: context.scaffoldBackgroundColor,
      elevation: 5,
      automaticallyImplyLeading: false,
      pinned: true,
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
          crossAxisSpacing: 3.0,
          mainAxisSpacing: 3.0,
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
          description: albumDescription.trim(),
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
        albumDescription: albumDescription,
        descriptionFocusNode: albumDescriptionTextFieldFocusNode,
        onDescriptionChanged: (description) {
          setState(() {
            albumDescription = description;
          });
        },
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
        widget.onFocusChanged(true);

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
    required this.albumDescription,
    required this.descriptionFocusNode,
    required this.onDescriptionChanged,
  });

  final String albumDescription;
  final FocusNode descriptionFocusNode;
  final ValueChanged<String> onDescriptionChanged;

  @override
  State<_AlbumViewerEditableDescription> createState() =>
      _AlbumViewerEditableDescriptionState();
}

class _AlbumViewerEditableDescriptionState
    extends State<_AlbumViewerEditableDescription> {
  late TextEditingController descriptionTextEditController;

  @override
  void initState() {
    super.initState();
    // For create album page, always start with the provided albumDescription
    descriptionTextEditController = TextEditingController(
      text: widget.albumDescription,
    );
    widget.descriptionFocusNode.addListener(_onFocusModeChange);
  }

  @override
  void dispose() {
    widget.descriptionFocusNode.removeListener(_onFocusModeChange);
    descriptionTextEditController.dispose();
    super.dispose();
  }

  void _onFocusModeChange() {
    if (!widget.descriptionFocusNode.hasFocus &&
        descriptionTextEditController.text.isEmpty) {
      widget.onDescriptionChanged("");
      descriptionTextEditController.text = "";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: TextField(
        onChanged: (value) {
          widget.onDescriptionChanged(value);
        },
        focusNode: widget.descriptionFocusNode,
        style: context.textTheme.bodyLarge,
        maxLines: 3,
        minLines: 1,
        controller: descriptionTextEditController,
        onTap: () {
          context.focusScope.requestFocus(widget.descriptionFocusNode);

          if (descriptionTextEditController.text == '') {
            descriptionTextEditController.clear();
          }
        },
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.all(8.0),
          suffixIcon: widget.descriptionFocusNode.hasFocus
              ? IconButton(
                  onPressed: () {
                    descriptionTextEditController.clear();
                    widget.onDescriptionChanged("");
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
          focusedBorder: const OutlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
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
