// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Applies credentials to an outgoing request's query and header params.
// ignore: one_member_abstracts
abstract class Authentication {
  /// Apply authentication settings to header and query params.
  Future<void> applyToParams(List<QueryParam> queryParams, Map<String, String> headerParams);
}
