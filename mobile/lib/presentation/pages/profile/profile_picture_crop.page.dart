import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:crop_image/crop_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
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
import 'package:immich_mobile/utils/image_converter.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
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
        final croppedImage = await cropController.croppedImage();
        final pngBytes = await imageToUint8List(croppedImage);
        final xFile = XFile.fromData(pngBytes, mimeType: 'image/png');
        final success = await ref
            .read(uploadProfileImageProvider.notifier)
            .upload(xFile, fileName: 'profile-picture.png');

        if (!context.mounted) return;

        if (success) {
          final profileImagePath = ref.read(uploadProfileImageProvider).profileImagePath;
          ref.watch(authProvider.notifier).updateUserProfileImagePath(profileImagePath);
          final user = ref.read(currentUserProvider);
          if (user != null) {
            unawaited(ref.read(currentUserProvider.notifier).refresh());
          }
          unawaited(ref.read(backupProvider.notifier).updateDiskInfo());

          ImmichToast.show(context: context, msg: 'profile_picture_set'.tr(), gravity: ToastGravity.BOTTOM);

          if (context.mounted) {
            unawaited(context.maybePop());
          }
        } else {
          ImmichToast.show(
            context: context,
            msg: 'errors.unable_to_set_profile_picture'.tr(),
            toastType: ToastType.error,
            gravity: ToastGravity.BOTTOM,
          );
        }
      } catch (e) {
        if (!context.mounted) return;

        ImmichToast.show(
          context: context,
          msg: 'errors.unable_to_set_profile_picture'.tr(),
          toastType: ToastType.error,
          gravity: ToastGravity.BOTTOM,
        );
      } finally {
        isLoading.value = false;
      }
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: context.scaffoldBackgroundColor,
        title: Text("set_profile_picture".tr()),
        leading: isLoading.value ? null : const ImmichCloseButton(),
        actions: [
          if (isLoading.value)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
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
            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(maxHeight: context.height * 0.7, maxWidth: context.width * 0.9),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.all(Radius.circular(7)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        spreadRadius: 2,
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    child: CropImage(controller: cropController, image: image, gridColor: Colors.white),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
