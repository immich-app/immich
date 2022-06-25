import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/models/curated_location.model.dart';
import 'package:immich_mobile/modules/search/models/curated_object.model.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:immich_mobile/shared/services/network.service.dart';

final searchServiceProvider =
    Provider((ref) => SearchService(ref.watch(networkServiceProvider)));

class SearchService {
  final NetworkService _networkService;
  SearchService(this._networkService);

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

      List<ImmichAsset> result =
          List.from(decodedData.map((a) => ImmichAsset.fromMap(a)));

      return result;
    } catch (e) {
      debugPrint("[ERROR] [searchAsset] ${e.toString()}");
      return null;
    }
  }

  Future<List<CuratedLocation>?> getCuratedLocation() async {
    try {
      var res = await _networkService.getRequest(url: "asset/allLocation");

      List<dynamic> decodedData = jsonDecode(res.toString());

      List<CuratedLocation> result =
          List.from(decodedData.map((a) => CuratedLocation.fromMap(a)));

      return result;
    } catch (e) {
      debugPrint("[ERROR] [getCuratedLocation] ${e.toString()}");
      throw Error();
    }
  }

  Future<List<CuratedObject>?> getCuratedObjects() async {
    try {
      var res = await _networkService.getRequest(url: "asset/allObjects");

      List<dynamic> decodedData = jsonDecode(res.toString());

      List<CuratedObject> result =
          List.from(decodedData.map((a) => CuratedObject.fromMap(a)));

      return result;
    } catch (e) {
      debugPrint("[ERROR] [CuratedObject] ${e.toString()}");
      throw Error();
    }
  }
}
