import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/upload_profile_image.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class AppBarProfileInfoBox extends HookConsumerWidget {
  const AppBarProfileInfoBox({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final uploadProfileImageStatus = ref.watch(uploadProfileImageProvider).status;
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);
    final user = ref.watch(currentUserProvider);

    Widget buildUserProfileImage() {
      if (user == null) {
        return const CircleAvatar(
          radius: 20,
          backgroundImage: AssetImage('assets/immich-logo.png'),
          backgroundColor: Colors.transparent,
        );
      }

      final userImage = UserCircleAvatar(size: 44, user: user, hasBorder: true);

      if (uploadProfileImageStatus == UploadProfileStatus.loading) {
        return const SizedBox(height: 40, width: 40, child: ImmichLoadingIndicator(borderRadius: 20));
      }

      return userImage;
    }

    Future<void> pickUserProfileImage() async {
      final XFile? image = await ImagePicker().pickImage(source: ImageSource.gallery, maxHeight: 1024, maxWidth: 1024);

      if (image != null && context.mounted) {
        final success = await ref.read(uploadProfileImageProvider.notifier).upload(image);

        if (success && context.mounted) {
          final profileImagePath = ref.read(uploadProfileImageProvider).profileImagePath;
          ref.read(authProvider.notifier).updateUserProfileImagePath(profileImagePath);
          if (user != null) {
            unawaited(ref.read(currentUserProvider.notifier).refresh());
          }

          unawaited(ref.read(backupProvider.notifier).updateDiskInfo());
        }
      }
    }

    void toggleReadonlyMode() {
      final isReadonlyModeEnabled = ref.read(readonlyModeProvider);
      ref.read(readonlyModeProvider.notifier).toggleReadonlyMode();

      context.scaffoldMessenger.showSnackBar(
        SnackBar(
          duration: const Duration(seconds: 2),
          content: Text(
            isReadonlyModeEnabled ? context.t.readonly_mode_disabled : context.t.readonly_mode_enabled,
            style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
          ),
        ),
      );
    }

    return ListTile(
      minLeadingWidth: 50,
      leading: GestureDetector(
        onTap: pickUserProfileImage,
        onLongPress: toggleReadonlyMode,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            AbsorbPointer(child: buildUserProfileImage()),
            if (!isReadonlyModeEnabled)
              Positioned(
                bottom: -5,
                right: -8,
                child: Material(
                  color: context.colorScheme.surfaceContainerHighest,
                  elevation: 3,
                  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(50.0))),
                  child: Padding(
                    padding: const EdgeInsets.all(5.0),
                    child: Icon(Icons.camera_alt_outlined, color: context.primaryColor, size: 14),
                  ),
                ),
              ),
          ],
        ),
      ),
      title: Text(
        authState.name,
        style: context.textTheme.titleMedium?.copyWith(color: context.primaryColor, fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        authState.userEmail,
        style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceSecondary),
      ),
    );
  }
}
