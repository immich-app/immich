import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/upload_profile_image.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class AppBarProfileInfoBox extends HookConsumerWidget {
  const AppBarProfileInfoBox({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final uploadProfileImageStatus =
        ref.watch(uploadProfileImageProvider).status;
    final user = Store.tryGet(StoreKey.currentUser);

    buildUserProfileImage() {
      if (user == null) {
        return const CircleAvatar(
          radius: 20,
          backgroundImage: AssetImage('assets/immich-logo.png'),
          backgroundColor: Colors.transparent,
        );
      }

      final userImage = UserCircleAvatar(
        radius: 22,
        size: 44,
        user: user,
      );

      if (uploadProfileImageStatus == UploadProfileStatus.loading) {
        return const SizedBox(
          height: 40,
          width: 40,
          child: ImmichLoadingIndicator(borderRadius: 20),
        );
      }

      return userImage;
    }

    pickUserProfileImage() async {
      final XFile? image = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxHeight: 1024,
        maxWidth: 1024,
      );

      if (image != null) {
        var success =
            await ref.watch(uploadProfileImageProvider.notifier).upload(image);

        if (success) {
          final profileImagePath =
              ref.read(uploadProfileImageProvider).profileImagePath;
          ref.watch(authProvider.notifier).updateUserProfileImagePath(
                profileImagePath,
              );
          if (user != null) {
            final updatedUser =
                user.copyWith(profileImagePath: profileImagePath);
            await Store.put(StoreKey.currentUser, updatedUser);
            ref.read(currentUserProvider.notifier).refresh();
          }
        }
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10.0),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: context.colorScheme.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(10),
            topRight: Radius.circular(10),
          ),
        ),
        child: ListTile(
          minLeadingWidth: 50,
          leading: GestureDetector(
            onTap: pickUserProfileImage,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                buildUserProfileImage(),
                Positioned(
                  bottom: -5,
                  right: -8,
                  child: Material(
                    color: context.colorScheme.surfaceContainerHighest,
                    elevation: 3,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(50.0),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(5.0),
                      child: Icon(
                        Icons.camera_alt_outlined,
                        color: context.primaryColor,
                        size: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          title: Text(
            authState.name,
            style: context.textTheme.titleMedium?.copyWith(
              color: context.primaryColor,
              fontWeight: FontWeight.w500,
            ),
          ),
          subtitle: Text(
            authState.userEmail,
            style: context.textTheme.bodySmall?.copyWith(
              color: context.colorScheme.onSurfaceSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
