import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/models/value.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/utils/files_helper.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';

final userServiceProvider = Provider(
  (ref) => UserService(
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
  ),
);

class UserService {
  final ApiService _apiService;
  final Isar _db;

  UserService(this._apiService, this._db);

  Future<List<UserResponseDto>?> getAllUsersInfo({required bool isAll}) async {
    try {
      return await _apiService.userApi.getAllUsers(isAll);
    } catch (e) {
      debugPrint("Error [getAllUsersInfo]  ${e.toString()}");
      return null;
    }
  }

  Future<List<User>> getAllUsersInDb({required bool all}) async {
    if (all) {
      return _db.users.where().findAll();
    }
    final int userId = await _db.values.getInt(DbKey.loggedInUser);
    return _db.users.where().isarIdNotEqualTo(userId).findAll();
  }

  Future<User?> getLoggedInUser() async {
    return _db.users.get(await _db.values.getInt(DbKey.loggedInUser));
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
