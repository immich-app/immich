import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

class SearchService {
  final NetworkService _networkService = NetworkService();

  Future<List<String>?> getUserSuggestedSearchTerms() async {
    try {
      var res = await _networkService.getRequest(url: "asset/searchTerm");
      List<dynamic> decodedData = jsonDecode(res.toString());

      return List.from(decodedData);
    } catch (e) {
      debugPrint("[ERROR] [getUserSuggestedSearchTerms] ${e.toString()}");
      return [];
    }
  }

  Future<List<ImmichAsset>?> searchAsset(String searchTerm) async {
    try {
      var res = await _networkService.postRequest(
        url: "asset/search",
        data: {"searchTerm": searchTerm},
      );

      List<dynamic> decodedData = jsonDecode(res.toString());

      List<ImmichAsset> result = List.from(decodedData.map((a) => ImmichAsset.fromMap(a)));

      return result;
    } catch (e) {
      debugPrint("[ERROR] [searchAsset] ${e.toString()}");
      return null;
    }
  }
}
