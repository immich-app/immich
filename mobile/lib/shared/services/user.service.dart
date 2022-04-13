import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/user_info.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

class UserService {
  final NetworkService _networkService = NetworkService();

  Future<List<UserInfo>> getAllUsersInfo() async {
    try {
      Response res = await _networkService.getRequest(url: 'user');
      List<dynamic> decodedData = jsonDecode(res.toString());
      List<UserInfo> result = List.from(decodedData.map((e) => UserInfo.fromMap(e)));

      return result;
    } catch (e) {
      debugPrint("Error getAllUsersInfo  ${e.toString()}");
    }

    return [];
  }
}
