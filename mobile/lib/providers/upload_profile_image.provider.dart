import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/utils/debug_print.dart';

part 'upload_profile_image.provider.freezed.dart';

enum UploadProfileStatus { idle, loading, success, failure }

@freezed
abstract class UploadProfileImageState with _$UploadProfileImageState {
  const factory UploadProfileImageState({required UploadProfileStatus status, required String profileImagePath}) =
      _UploadProfileImageState;
}

class UploadProfileImageNotifier extends StateNotifier<UploadProfileImageState> {
  UploadProfileImageNotifier(this._userService)
    : super(const UploadProfileImageState(profileImagePath: '', status: UploadProfileStatus.idle));

  final UserService _userService;

  Future<bool> upload(XFile file, {String? fileName}) async {
    state = state.copyWith(status: UploadProfileStatus.loading);

    final profileImagePath = await _userService.createProfileImage(fileName ?? file.name, await file.readAsBytes());

    if (profileImagePath != null) {
      dPrint(() => "Successfully upload profile image");
      state = state.copyWith(status: UploadProfileStatus.success, profileImagePath: profileImagePath);
      return true;
    }

    state = state.copyWith(status: UploadProfileStatus.failure);
    return false;
  }
}

final uploadProfileImageProvider = StateNotifierProvider<UploadProfileImageNotifier, UploadProfileImageState>(
  (ref) => UploadProfileImageNotifier(ref.watch(userServiceProvider)),
);
