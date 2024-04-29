import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/home/providers/upload_profile_image.provider.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/ui/user_circle_avatar.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class AppBarProfileInfoBox extends HookConsumerWidget {
  const AppBarProfileInfoBox({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AuthenticationState authState = ref.watch(authenticationProvider);
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
          ref.watch(authenticationProvider.notifier).updateUserProfileImagePath(
                profileImagePath,
              );
          if (user != null) {
            user.profileImagePath = profileImagePath;
            Store.put(StoreKey.currentUser, user);
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
          color: context.isDarkTheme
              ? context.scaffoldBackgroundColor
              : const Color.fromARGB(255, 225, 229, 240),
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
                    color: context.isDarkTheme
                        ? Colors.blueGrey[800]
                        : Colors.white,
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
              color: context.textTheme.bodySmall?.color?.withAlpha(200),
            ),
          ),
        ),
      ),
    );
  }
}
