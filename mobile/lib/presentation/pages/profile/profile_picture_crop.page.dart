import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:crop_image/crop_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
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
import 'package:immich_mobile/utils/image_converter.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_ui/immich_ui.dart';

@RoutePage()
class ProfilePictureCropPage extends ConsumerStatefulWidget {
  final BaseAsset asset;

  const ProfilePictureCropPage({super.key, required this.asset});

  @override
  ConsumerState<ProfilePictureCropPage> createState() => _ProfilePictureCropPageState();
}

class _ProfilePictureCropPageState extends ConsumerState<ProfilePictureCropPage> {
  late final CropController _cropController;
  bool _isLoading = false;
  bool _didInitCropController = false;

  @override
  void initState() {
    super.initState();
    _cropController = CropController(defaultCrop: const Rect.fromLTRB(0, 0, 1, 1));

    // Lock aspect ratio to 1:1 for circular/square crop
    // CropController depends on CropImage initializing its bitmap size.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _didInitCropController) {
        return;
      }
      _didInitCropController = true;

      _cropController.crop = const Rect.fromLTRB(0.1, 0.1, 0.9, 0.9);
      _cropController.aspectRatio = 1.0;
    });
  }

  @override
  void dispose() {
    _cropController.dispose();
    super.dispose();
  }

  Future<void> _handleDone() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final croppedImage = await _cropController.croppedImage();
      final pngBytes = await imageToUint8List(croppedImage);
      final xFile = XFile.fromData(pngBytes, mimeType: 'image/png');
      final success = await ref
          .read(uploadProfileImageProvider.notifier)
          .upload(xFile, fileName: 'profile-picture.png');

      if (!context.mounted) return;

      if (success) {
        final profileImagePath = ref.read(uploadProfileImageProvider).profileImagePath;
        ref.read(authProvider.notifier).updateUserProfileImagePath(profileImagePath);
        final user = ref.read(currentUserProvider);
        if (user != null) {
          unawaited(ref.read(currentUserProvider.notifier).refresh());
        }
        unawaited(ref.read(backupProvider.notifier).updateDiskInfo());

        ImmichToast.show(
          context: context,
          msg: 'profile_picture_set'.tr(),
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.success,
        );

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
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Create Image widget from asset
    final image = Image(image: getFullImageProvider(widget.asset));

    return Scaffold(
      appBar: AppBar(
        backgroundColor: context.scaffoldBackgroundColor,
        title: Text("set_profile_picture".tr()),
        leading: _isLoading ? null : const ImmichCloseButton(),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            )
          else
            ImmichIconButton(
              icon: Icons.done_rounded,
              color: ImmichColor.primary,
              variant: ImmichVariant.ghost,
              onPressed: _handleDone,
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
                    child: CropImage(controller: _cropController, image: image, gridColor: Colors.white),
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
