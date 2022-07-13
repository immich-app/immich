import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/utils/files_helper.dart';
import 'package:openapi/api.dart';

final userServiceProvider = Provider(
  (ref) => UserService(
    ref.watch(apiServiceProvider),
  ),
);

class UserService {
  final ApiService _apiService;

  UserService(this._apiService);

  Future<List<UserResponseDto>?> getAllUsersInfo({required bool isAll}) async {
    try {
      return await _apiService.userApi.getAllUsers(isAll);
    } catch (e) {
      debugPrint("Error [getAllUsersInfo]  ${e.toString()}");
      return null;
    }
  }

  Future<CreateProfileImageResponseDto?> uploadProfileImage(XFile image) async {
    try {
      var mimeType = FileHelper.getMimeType(image.path);

      return await _apiService.userApi.createProfileImage(
        MultipartFile.fromBytes(
          'file',
          await image.readAsBytes(),
          filename: image.name,
          contentType: MediaType(
            mimeType["type"],
            mimeType["subType"],
          ),
        ),
      );
    } catch (e) {
      debugPrint("Error [uploadProfileImage] ${e.toString()}");
      return null;
    }
  }
}
