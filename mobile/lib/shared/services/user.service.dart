import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/shared/models/upload_profile_image_repsonse.model.dart';
import 'package:immich_mobile/shared/models/user.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

class UserService {
  final NetworkService _networkService = NetworkService();

  Future<List<User>> getAllUsersInfo() async {
    try {
      var res = await _networkService.getRequest(url: 'user');
      List<dynamic> decodedData = jsonDecode(res.toString());
      List<User> result = List.from(decodedData.map((e) => User.fromMap(e)));

      return result;
    } catch (e) {
      debugPrint("Error getAllUsersInfo  ${e.toString()}");
    }

    return [];
  }

  Future<UploadProfileImageResponse?> uploadProfileImage(XFile image) async {
    var res = await _networkService.uploadProfileImage(image);
    var payload = UploadProfileImageResponse.fromJson(res.toString());

    return payload;
  }
}
