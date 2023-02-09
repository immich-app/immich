import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/utils/diff.dart';
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

  Future<List<User>?> _getAllUsers({required bool isAll}) async {
    try {
      final dto = await _apiService.userApi.getAllUsers(isAll);
      return dto?.map(User.fromDto).toList();
    } catch (e) {
      debugPrint("Error [getAllUsersInfo]  ${e.toString()}");
      return null;
    }
  }

  Future<List<User>> getUsersInDb({bool self = false}) async {
    if (self) {
      return _db.users.where().findAll();
    }
    final int userId = Store.get<User>(StoreKey.currentUser)!.isarId;
    return _db.users.where().isarIdNotEqualTo(userId).findAll();
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

  Future<void> fetchAllUsers() async {
    final users = await _getAllUsers(isAll: true);
    if (users == null) {
      return;
    }
    users.sortBy((u) => u.id);
    final dbUsers = await _db.users.where().sortById().findAll();
    List<int> toDelete = [];
    List<User> toUpsert = [];
    final changes = await diffSortedLists(
      users,
      dbUsers,
      compare: (a, b) => a.id.compareTo(b.id),
      both: (a, b) {
        if (a.updatedAt != b.updatedAt) {
          toUpsert.add(a);
          return true;
        }
        return false;
      },
      onlyFirst: (a) => toUpsert.add(a),
      onlySecond: (b) => toDelete.add(b.isarId),
    );
    if (changes) {
      await _db.writeTxn(() async {
        await _db.users.deleteAll(toDelete);
        await _db.users.putAll(toUpsert);
      });
    }
  }
}
