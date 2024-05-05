import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album_viewer.provider.dart';
import 'package:immich_mobile/entities/album.entity.dart';

class AlbumViewerEditableTitle extends HookConsumerWidget {
  final Album album;
  final FocusNode titleFocusNode;
  const AlbumViewerEditableTitle({
    super.key,
    required this.album,
    required this.titleFocusNode,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final titleTextEditController = useTextEditingController(text: album.name);

    void onFocusModeChange() {
      if (!titleFocusNode.hasFocus && titleTextEditController.text.isEmpty) {
        ref.watch(albumViewerProvider.notifier).setEditTitleText("Untitled");
        titleTextEditController.text = "Untitled";
      }
    }

    useEffect(
      () {
        titleFocusNode.addListener(onFocusModeChange);
        return () {
          titleFocusNode.removeListener(onFocusModeChange);
        };
      },
      [],
    );

    return TextField(
      onChanged: (value) {
        if (value.isEmpty) {
        } else {
          ref.watch(albumViewerProvider.notifier).setEditTitleText(value);
        }
      },
      focusNode: titleFocusNode,
      style: context.textTheme.headlineMedium,
      controller: titleTextEditController,
      onTap: () {
        FocusScope.of(context).requestFocus(titleFocusNode);

        ref.watch(albumViewerProvider.notifier).setEditTitleText(album.name);
        ref.watch(albumViewerProvider.notifier).enableEditAlbum();

        if (titleTextEditController.text == 'Untitled') {
          titleTextEditController.clear();
        }
      },
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        suffixIcon: titleFocusNode.hasFocus
            ? IconButton(
                onPressed: () {
                  titleTextEditController.clear();
                },
                icon: Icon(
                  Icons.cancel_rounded,
                  color: context.primaryColor,
                ),
                splashRadius: 10,
              )
            : null,
        enabledBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: Colors.transparent),
          borderRadius: BorderRadius.circular(10),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: Colors.transparent),
          borderRadius: BorderRadius.circular(10),
        ),
        focusColor: Colors.grey[300],
        fillColor: context.isDarkTheme
            ? const Color.fromARGB(255, 32, 33, 35)
            : Colors.grey[200],
        filled: titleFocusNode.hasFocus,
        hintText: 'share_add_title'.tr(),
        hintStyle: TextStyle(
          fontSize: 28,
          color: context.isDarkTheme ? Colors.grey[300] : Colors.grey[700],
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
