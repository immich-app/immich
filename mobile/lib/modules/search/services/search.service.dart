import 'dart:convert';

import 'package:flutter/material.dart';
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
}
