import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

class SharedAlbumService {
  final NetworkService _networkService = NetworkService();

  Future<List<SharedAlbum>> getAllSharedAlbum() async {
    try {
      var res = await _networkService.getRequest(url: 'shared/allSharedAlbums');
      List<dynamic> decodedData = jsonDecode(res.toString());
      List<SharedAlbum> result = List.from(decodedData.map((e) => SharedAlbum.fromMap(e)));

      return result;
    } catch (e) {
      debugPrint("Error getAllSharedAlbum  ${e.toString()}");
    }

    return [];
  }
}
