import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/album/album_action_filled_button.dart';

@RoutePage()
class DriftCreateAlbumPage extends ConsumerStatefulWidget {
  const DriftCreateAlbumPage({super.key});

  @override
  ConsumerState<DriftCreateAlbumPage> createState() => _DriftCreateAlbumPageState();
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
        : 'create_album_page_untitled'.t(context: context);
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
        preferredSize: const Size.fromHeight(200.0),
        child: SizedBox(
          height: 200,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              buildTitleInputField(),
              buildDescriptionInputField(),
              if (selectedAssets.isNotEmpty) buildControlButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (selectedAssets.isEmpty) {
      return SliverList(delegate: SliverChildListDelegate([_buildEmptyState(), _buildSelectPhotosButton()]));
    } else {
      return _buildSelectedImageGrid();
    }
  }

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.only(top: 0, left: 18),
      child: Text('create_shared_album_page_share_add_assets', style: context.textTheme.labelLarge).t(),
    );
  }

  Widget _buildSelectPhotosButton() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: FilledButton.icon(
        style: FilledButton.styleFrom(
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10.0))),
          backgroundColor: context.colorScheme.surfaceContainerHigh,
        ),
        onPressed: onSelectPhotos,
        icon: Icon(Icons.add_rounded, color: context.primaryColor),
        label: Padding(
          padding: const EdgeInsets.only(left: 8.0),
          child: Text(
            'create_shared_album_page_share_select_photos',
            style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: context.primaryColor),
          ).t(),
        ),
      ),
    );
  }

  Widget _buildSelectedImageGrid() {
    return SliverPadding(
      padding: const EdgeInsets.only(top: 16.0),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          crossAxisSpacing: 1.0,
          mainAxisSpacing: 1.0,
        ),
        delegate: SliverChildBuilderDelegate((context, index) {
          final asset = selectedAssets.elementAt(index);
          return GestureDetector(
            onTap: onBackgroundTapped,
            child: Thumbnail.fromAsset(asset: asset),
          );
        }, childCount: selectedAssets.length),
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
      DriftAssetSelectionTimelineRoute(lockedSelectionAssets: selectedAssets),
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
          SnackBar(content: Text('create_album_title_required'.t()), backgroundColor: context.colorScheme.error),
        );
      }
      return;
    }

    final album = await ref
        .watch(remoteAlbumProvider.notifier)
        .createAlbum(
          title: title,
          description: albumDescriptionController.text.trim(),
          assetIds: selectedAssets.map((asset) {
            final remoteAsset = asset as RemoteAsset;
            return remoteAsset.id;
          }).toList(),
        );

    if (album != null) {
      ref.read(currentRemoteAlbumProvider.notifier).setAlbum(album);
      context.replaceRoute(RemoteAlbumRoute(album: album));
    }
  }

  Widget buildTitleInputField() {
    return Padding(
      padding: const EdgeInsets.only(right: 10.0, left: 10.0),
      child: _AlbumTitleTextField(
        focusNode: albumTitleTextFieldFocusNode,
        textController: albumTitleController,
        isFocus: isAlbumTitleTextFieldFocus,
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
      padding: const EdgeInsets.only(right: 10.0, left: 10.0, top: 8),
      child: _AlbumViewerEditableDescription(
        textController: albumDescriptionController,
        focusNode: albumDescriptionTextFieldFocusNode,
      ),
    );
  }

  Widget buildControlButton() {
    return Padding(
      padding: const EdgeInsets.only(left: 12.0, top: 8.0, bottom: 8.0),
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
        leading: IconButton(onPressed: () => context.maybePop(), icon: const Icon(Icons.close_rounded)),
        title: const Text('create_album').t(),
        actions: [
          TextButton(
            onPressed: _canCreateAlbum ? createAlbum : null,
            child: Text(
              'create'.t(),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: _canCreateAlbum ? context.primaryColor : context.themeData.disabledColor,
              ),
            ),
          ),
        ],
      ),
      body: GestureDetector(
        onTap: onBackgroundTapped,
        child: CustomScrollView(slivers: [_buildSliverAppBar(), _buildContent()]),
      ),
    );
  }
}

class _AlbumTitleTextField extends StatefulWidget {
  const _AlbumTitleTextField({
    required this.focusNode,
    required this.textController,
    required this.isFocus,
    required this.onFocusChanged,
  });

  final FocusNode focusNode;
  final TextEditingController textController;
  final bool isFocus;
  final ValueChanged<bool> onFocusChanged;

  @override
  State<_AlbumTitleTextField> createState() => _AlbumTitleTextFieldState();
}

class _AlbumTitleTextFieldState extends State<_AlbumTitleTextField> {
  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_onFocusChange);
    super.dispose();
  }

  void _onFocusChange() {
    widget.onFocusChanged(widget.focusNode.hasFocus);
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      focusNode: widget.focusNode,
      style: TextStyle(fontSize: 28.0, color: context.colorScheme.onSurface, fontWeight: FontWeight.bold),
      controller: widget.textController,
      onTap: () {
        if (widget.textController.text == 'create_album_page_untitled'.t(context: context)) {
          widget.textController.clear();
        }
      },
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 16.0),
        suffixIcon: widget.textController.text.isNotEmpty && widget.isFocus
            ? IconButton(
                onPressed: () {
                  widget.textController.clear();
                },
                icon: Icon(Icons.cancel_rounded, color: context.primaryColor),
                splashRadius: 10.0,
              )
            : null,
        enabledBorder: const OutlineInputBorder(
          borderSide: BorderSide(color: Colors.transparent),
          borderRadius: BorderRadius.all(Radius.circular(16.0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: context.primaryColor.withValues(alpha: 0.3)),
          borderRadius: const BorderRadius.all(Radius.circular(16.0)),
        ),
        hintText: 'add_a_title'.t(),
        hintStyle: context.themeData.inputDecorationTheme.hintStyle?.copyWith(
          fontSize: 28.0,
          fontWeight: FontWeight.bold,
          height: 1.2,
        ),
        focusColor: Colors.grey[300],
        fillColor: context.colorScheme.surfaceContainerHigh,
        filled: true,
      ),
    );
  }
}

class _AlbumViewerEditableDescription extends StatefulWidget {
  const _AlbumViewerEditableDescription({required this.textController, required this.focusNode});

  final TextEditingController textController;
  final FocusNode focusNode;

  @override
  State<_AlbumViewerEditableDescription> createState() => _AlbumViewerEditableDescriptionState();
}

class _AlbumViewerEditableDescriptionState extends State<_AlbumViewerEditableDescription> {
  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_onFocusModeChange);
    widget.textController.addListener(_onTextChange);
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_onFocusModeChange);
    widget.textController.removeListener(_onTextChange);
    super.dispose();
  }

  void _onFocusModeChange() {
    setState(() {
      if (!widget.focusNode.hasFocus && widget.textController.text.isEmpty) {
        widget.textController.clear();
      }
    });
  }

  void _onTextChange() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: TextField(
        focusNode: widget.focusNode,
        style: context.textTheme.bodyLarge,
        maxLines: 3,
        minLines: 1,
        controller: widget.textController,
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 16.0),
          suffixIcon: widget.focusNode.hasFocus && widget.textController.text.isNotEmpty
              ? IconButton(
                  onPressed: () {
                    widget.textController.clear();
                  },
                  icon: Icon(Icons.cancel_rounded, color: context.primaryColor),
                  splashRadius: 10.0,
                )
              : null,
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: context.colorScheme.outline.withValues(alpha: 0.3)),
            borderRadius: const BorderRadius.all(Radius.circular(16.0)),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: context.primaryColor.withValues(alpha: 0.3)),
            borderRadius: const BorderRadius.all(Radius.circular(16.0)),
          ),
          hintStyle: context.themeData.inputDecorationTheme.hintStyle?.copyWith(
            fontSize: 16.0,
            color: context.colorScheme.onSurface.withValues(alpha: 0.6),
          ),
          focusColor: Colors.grey[300],
          fillColor: context.scaffoldBackgroundColor,
          filled: widget.focusNode.hasFocus,
          hintText: 'add_a_description'.t(),
        ),
      ),
    );
  }
}
