import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/providers/album_viewer.provider.dart';

class AlbumViewerEditableTitle extends HookConsumerWidget {
  final SharedAlbum albumInfo;
  final FocusNode titleFocusNode;
  const AlbumViewerEditableTitle({Key? key, required this.albumInfo, required this.titleFocusNode}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final titleTextEditController = useTextEditingController(text: albumInfo.albumName);

    void onFocusModeChange() {
      print("on focus change");
    }

    useEffect(() {
      titleFocusNode.addListener(onFocusModeChange);
      return () {
        titleFocusNode.removeListener(onFocusModeChange);
      };
    }, []);

    return TextField(
      onChanged: (value) {
        // if (v.isEmpty) {
        //   isAlbumTitleEmpty.value = true;
        // } else {
        //   isAlbumTitleEmpty.value = false;
        // }

        ref.watch(albumViewerProvider.notifier).setEditTitleText(value);
      },
      focusNode: titleFocusNode,
      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
      controller: titleTextEditController,
      onTap: () {
        FocusScope.of(context).requestFocus(titleFocusNode);

        ref.watch(albumViewerProvider.notifier).enableEditAlbum();
        // isAlbumTitleTextFieldFocus.value = true;

        // if (albumTitleController.text == 'Untitled') {
        //   albumTitleController.clear();
        // }
      },
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        suffixIcon: titleFocusNode.hasFocus
            ? IconButton(
                onPressed: () {
                  titleTextEditController.clear();
                },
                icon: const Icon(Icons.cancel_rounded),
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
        fillColor: Colors.grey[200],
        filled: titleFocusNode.hasFocus,
        hintText: 'Add a title',
      ),
    );
  }
}
