import 'dart:async';
import 'dart:ui' as ui;

import 'package:auto_route/auto_route.dart';
import 'package:crop_image/crop_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/upload_profile_image.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/hooks/crop_controller_hook.dart';
import 'package:immich_ui/immich_ui.dart';

@RoutePage()
class ProfilePictureCropPage extends HookConsumerWidget {
  final BaseAsset asset;

  const ProfilePictureCropPage({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cropController = useCropController();
    final isLoading = useState<bool>(false);
    final didInitCropController = useRef(false);

    // Lock aspect ratio to 1:1 for circular/square crop
    useEffect(() {
      // CropController depends on CropImage initializing its bitmap size.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (didInitCropController.value) {
          return;
        }
        didInitCropController.value = true;

        cropController.crop = const Rect.fromLTRB(0.1, 0.1, 0.9, 0.9);
        cropController.aspectRatio = 1.0;
      });
      return null;
    }, [cropController]);

    // Create Image widget from asset
    final image = Image(image: getFullImageProvider(asset));

    Future<void> handleDone() async {
      if (isLoading.value) return;

      isLoading.value = true;

      try {
        // Get cropped image widget
        final croppedImage = await cropController.croppedImage();

        // Convert Image widget to ui.Image
        final completer = Completer<ui.Image>();
        croppedImage.image.resolve(ImageConfiguration.empty).addListener(
          ImageStreamListener((ImageInfo info, bool _) {
            completer.complete(info.image);
          }),
        );
        final uiImage = await completer.future;

        // Convert ui.Image to Uint8List
        final byteData = await uiImage.toByteData(format: ui.ImageByteFormat.png);
        if (byteData == null) {
          throw Exception('Failed to convert image to bytes');
        }
        final pngBytes = byteData.buffer.asUint8List();

        // Create XFile and upload
        final xFile = XFile.fromData(pngBytes, mimeType: 'image/png', name: 'profile-picture.png');
        final success = await ref.read(uploadProfileImageProvider.notifier).upload(xFile);

        if (!context.mounted) return;

        if (success) {
          // Update user state
          final profileImagePath = ref.read(uploadProfileImageProvider).profileImagePath;
          ref.read(authProvider.notifier).updateUserProfileImagePath(profileImagePath);
          final user = ref.read(currentUserProvider);
          if (user != null) {
            unawaited(ref.read(currentUserProvider.notifier).refresh());
          }
          unawaited(ref.read(backupProvider.notifier).updateDiskInfo());

          // Show success message and navigate back
          context.scaffoldMessenger.showSnackBar(
            SnackBar(
              duration: const Duration(seconds: 2),
              content: Text(
                "profile_picture_set".tr(),
                style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
              ),
            ),
          );

          if (context.mounted) {
            unawaited(context.maybePop());
          }
        } else {
          // Show error message
          context.scaffoldMessenger.showSnackBar(
            SnackBar(
              duration: const Duration(seconds: 2),
              content: Text(
                "errors.unable_to_set_profile_picture".tr(),
                style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
              ),
            ),
          );
        }
      } catch (e) {
        if (!context.mounted) return;

        context.scaffoldMessenger.showSnackBar(
          SnackBar(
            duration: const Duration(seconds: 2),
            content: Text(
              "errors.unable_to_set_profile_picture".tr(),
              style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
            ),
          ),
        );
      } finally {
        isLoading.value = false;
      }
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: context.scaffoldBackgroundColor,
        title: Text("set_profile_picture".tr()),
        leading: isLoading.value
            ? null
            : const ImmichCloseButton(),
        actions: [
          if (isLoading.value)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            ImmichIconButton(
              icon: Icons.done_rounded,
              color: ImmichColor.primary,
              variant: ImmichVariant.ghost,
              onPressed: handleDone,
            ),
        ],
      ),
      backgroundColor: context.scaffoldBackgroundColor,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (BuildContext context, BoxConstraints constraints) {
            return Column(
              children: [
                Container(
                  padding: const EdgeInsets.only(top: 20),
                  width: constraints.maxWidth * 0.9,
                  height: constraints.maxHeight * 0.6,
                  child: CropImage(controller: cropController, image: image, gridColor: Colors.white),
                ),
                Expanded(
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: context.scaffoldBackgroundColor,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                      ),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(left: 20, right: 20, bottom: 10),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                ImmichIconButton(
                                  icon: Icons.rotate_left,
                                  variant: ImmichVariant.ghost,
                                  color: ImmichColor.secondary,
                                  onPressed: isLoading.value
                                      ? () {}
                                      : () => cropController.rotateLeft(),
                                ),
                                ImmichIconButton(
                                  icon: Icons.rotate_right,
                                  variant: ImmichVariant.ghost,
                                  color: ImmichColor.secondary,
                                  onPressed: isLoading.value
                                      ? () {}
                                      : () => cropController.rotateRight(),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
