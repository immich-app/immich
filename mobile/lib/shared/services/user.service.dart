import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/upload_profile_image_repsonse.model.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/network.service.dart';
import 'package:immich_mobile/utils/dio_http_interceptor.dart';
import 'package:immich_mobile/utils/files_helper.dart';
import 'package:openapi/api.dart';

final userServiceProvider = Provider(
  (ref) => UserService(
    ref.watch(networkServiceProvider),
    ref.watch(apiServiceProvider),
  ),
);

class UserService {
  final NetworkService _networkService;
  final ApiService _apiService;

  UserService(this._networkService, this._apiService);

  Future<List<UserResponseDto>?> getAllUsersInfo({required bool isAll}) async {
    try {
      return await _apiService.userApi.getAllUsers(isAll);
    } catch (e) {
      debugPrint("Error [getAllUsersInfo]  ${e.toString()}");
      return null;
    }
  }

  Future<UploadProfileImageResponse?> uploadProfileImage(XFile image) async {
    var dio = Dio();
    dio.interceptors.add(AuthenticatedRequestInterceptor());
    String savedEndpoint = Hive.box(userInfoBox).get(serverEndpointKey);
    var mimeType = FileHelper.getMimeType(image.path);

    final imageData = MultipartFile.fromBytes(
      await image.readAsBytes(),
      filename: image.name,
      contentType: MediaType(
        mimeType["type"],
        mimeType["subType"],
      ),
    );

    final formData = FormData.fromMap({'file': imageData});

    try {
      Response res = await dio.post(
        '$savedEndpoint/user/profile-image',
        data: formData,
      );

      var payload = UploadProfileImageResponse.fromJson(res.toString());

      return payload;
    } on DioError catch (e) {
      debugPrint("Error uploading file: ${e.response}");
      return null;
    } catch (e) {
      debugPrint("Error uploading file: $e");
      return null;
    }
  }
}
