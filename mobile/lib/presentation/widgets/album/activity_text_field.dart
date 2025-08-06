import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/activity.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class DriftActivityTextField extends HookConsumerWidget {
  final bool isEnabled;
  final String? likeId;
  final Function(String) onSubmit;

  const DriftActivityTextField({required this.onSubmit, this.isEnabled = true, this.likeId, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentRemoteAlbumProvider)!;
    final asset = ref.watch(currentAssetNotifier) as RemoteAsset?;
    final activityNotifier = ref.read(albumActivityProvider(album.id, asset?.id).notifier);
    final user = ref.watch(currentUserProvider);
    final inputController = useTextEditingController();
    final inputFocusNode = useFocusNode();
    final liked = likeId != null;

    // Show keyboard immediately on activities open
    useEffect(() {
      inputFocusNode.requestFocus();
      return null;
    }, []);

    // Pass text to callback and reset controller
    void onEditingComplete() {
      onSubmit(inputController.text);
      inputController.clear();
      inputFocusNode.unfocus();
    }

    Future<void> addLike() async {
      await activityNotifier.addLike();
    }

    Future<void> removeLike() async {
      if (liked) {
        await activityNotifier.removeActivity(likeId!);
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: inputController,
        enabled: isEnabled,
        focusNode: inputFocusNode,
        textInputAction: TextInputAction.send,
        autofocus: false,
        decoration: InputDecoration(
          border: InputBorder.none,
          focusedBorder: InputBorder.none,
          prefixIcon: user != null
              ? Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  child: UserCircleAvatar(user: user, size: 30, radius: 15),
                )
              : null,
          suffixIcon: Padding(
            padding: const EdgeInsets.only(right: 10),
            child: IconButton(
              icon: Icon(liked ? Icons.favorite_rounded : Icons.favorite_border_rounded),
              onPressed: liked ? removeLike : addLike,
            ),
          ),
          suffixIconColor: liked ? Colors.red[700] : null,
          hintText: !isEnabled ? 'shared_album_activities_input_disable'.tr() : 'say_something'.tr(),
          hintStyle: TextStyle(fontWeight: FontWeight.normal, fontSize: 14, color: Colors.grey[600]),
        ),
        onEditingComplete: onEditingComplete,
        onTapOutside: (_) => inputFocusNode.unfocus(),
      ),
    );
  }
}
