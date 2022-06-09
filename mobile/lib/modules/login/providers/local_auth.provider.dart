import 'package:dio/dio.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

import '../../../constants/hive_box.dart';
import '../models/login_response.model.dart';

class LocalAuthProvider {

  static Future<bool> tryLogin(String email, String password, NetworkService _ns) async {
    try {
      Response res = await _ns.postRequest(
          url: 'auth/login', data: {'email': email, 'password': password});
      var payload = LogInReponse.fromJson(res.toString());
      Hive.box(userInfoBox).put(accessTokenKey, payload.accessToken);
      return true;
    } catch (e) {
      return false;
    }
  }

}