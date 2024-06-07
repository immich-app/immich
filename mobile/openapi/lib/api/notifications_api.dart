//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class NotificationsApi {
  NotificationsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /notifications/test-email' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SmtpVerificationDto] smtpVerificationDto (required):
  Future<Response> testEmailNotificationWithHttpInfo(SmtpVerificationDto smtpVerificationDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/notifications/test-email';

    // ignore: prefer_final_locals
    Object? postBody = smtpVerificationDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [SmtpVerificationDto] smtpVerificationDto (required):
  Future<void> testEmailNotification(SmtpVerificationDto smtpVerificationDto,) async {
    final response = await testEmailNotificationWithHttpInfo(smtpVerificationDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
