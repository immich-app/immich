import 'package:dio/dio.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/services/network.service.dart';
import 'package:immich_mobile/utils/dio_http_interceptor.dart';

class ImageViewerService {
  final NetworkService _networkService = NetworkService();

  downloadAssetToDevice(String deviceAssetId, String deviceId) async {
    var requestUrl = "asset/download?aid=$deviceAssetId&did=$deviceId&isThumb=true";

    var dio = Dio();
    dio.interceptors.add(AuthenticatedRequestInterceptor());
    var savedEndpoint = Hive.box(userInfoBox).get(serverEndpointKey);

    Response res = await dio.get(
      '$savedEndpoint/$requestUrl',
      options: Options(responseType: ResponseType.bytes),
    );

    print(res.data);
    // var byteData = Uint8List.fromList();

    // print(byteData.length);
  }
}
