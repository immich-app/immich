import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/sharing/ui/album_title_text_field.dart';

class CreateSharedAlbumPage extends HookConsumerWidget {
  const CreateSharedAlbumPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumTitleController = useTextEditingController.fromValue(TextEditingValue.empty);
    final albumTitleTextFieldFocusNode = useFocusNode();
    final isAlbumTitleTextFieldFocus = useState(false);
    final isAlbumTitleEmpty = useState(true);

    _submitCreateNewAlbum() {}

    return Scaffold(
        appBar: AppBar(
          elevation: 0,
          centerTitle: false,
          leading: IconButton(
              onPressed: () {
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
          child: ListView(
            children: [
              Padding(
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
              const Padding(
                padding: EdgeInsets.only(top: 200, left: 18),
                child: Text(
                  'ADD PHOTOS',
                  style: TextStyle(fontSize: 12),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 16, left: 18, right: 18),
                child: OutlinedButton.icon(
                  style: ButtonStyle(
                    alignment: Alignment.centerLeft,
                    padding:
                        MaterialStateProperty.all<EdgeInsets>(const EdgeInsets.symmetric(vertical: 22, horizontal: 16)),
                  ),
                  onPressed: () {},
                  icon: const Icon(Icons.add_rounded),
                  label: const Padding(
                    padding: EdgeInsets.only(left: 8.0),
                    child: Text(
                      'Select photos',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              )
            ],
          ),
        ));
  }
}
