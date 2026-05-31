// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class UsersApi {
  UsersApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion searchUsersAddedIn = .new(1, 0, 0);

  static const ApiState searchUsersState = .stable;

  static const ApiVersion getMyUserAddedIn = .new(1, 0, 0);

  static const ApiState getMyUserState = .stable;

  static const ApiVersion updateMyUserAddedIn = .new(1, 0, 0);

  static const ApiState updateMyUserState = .stable;

  static const ApiVersion deleteUserLicenseAddedIn = .new(1, 0, 0);

  static const ApiState deleteUserLicenseState = .stable;

  static const ApiVersion getUserLicenseAddedIn = .new(1, 0, 0);

  static const ApiState getUserLicenseState = .stable;

  static const ApiVersion setUserLicenseAddedIn = .new(1, 0, 0);

  static const ApiState setUserLicenseState = .stable;

  static const ApiVersion deleteUserOnboardingAddedIn = .new(1, 0, 0);

  static const ApiState deleteUserOnboardingState = .stable;

  static const ApiVersion getUserOnboardingAddedIn = .new(1, 0, 0);

  static const ApiState getUserOnboardingState = .stable;

  static const ApiVersion setUserOnboardingAddedIn = .new(1, 0, 0);

  static const ApiState setUserOnboardingState = .stable;

  static const ApiVersion getMyPreferencesAddedIn = .new(1, 0, 0);

  static const ApiState getMyPreferencesState = .stable;

  static const ApiVersion updateMyPreferencesAddedIn = .new(1, 0, 0);

  static const ApiState updateMyPreferencesState = .stable;

  static const ApiVersion deleteProfileImageAddedIn = .new(1, 0, 0);

  static const ApiState deleteProfileImageState = .stable;

  static const ApiVersion createProfileImageAddedIn = .new(1, 0, 0);

  static const ApiState createProfileImageState = .stable;

  static const ApiVersion getUserAddedIn = .new(1, 0, 0);

  static const ApiState getUserState = .stable;

  static const ApiVersion getProfileImageAddedIn = .new(1, 0, 0);

  static const ApiState getProfileImageState = .stable;

  /// Get all users
  ///
  /// Retrieve a list of all users on the server.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchUsersWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/users';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get all users
  ///
  /// Retrieve a list of all users on the server.
  ///
  /// Available since server v1.0.0.
  Future<List<UserResponseDto>> searchUsers({Future<void>? abortTrigger}) async {
    final response = await searchUsersWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<UserResponseDto>') as List)
          .cast<UserResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get current user
  ///
  /// Retrieve information about the user making the API request.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getMyUserWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/users/me';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get current user
  ///
  /// Retrieve information about the user making the API request.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> getMyUser({Future<void>? abortTrigger}) async {
    final response = await getMyUserWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update current user
  ///
  /// Update the current user making the API request.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateMyUserWithHttpInfo(UserUpdateMeDto userUpdateMeDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/users/me';

    Object? postBody = userUpdateMeDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Update current user
  ///
  /// Update the current user making the API request.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> updateMyUser(UserUpdateMeDto userUpdateMeDto, {Future<void>? abortTrigger}) async {
    final response = await updateMyUserWithHttpInfo(userUpdateMeDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete user product key
  ///
  /// Delete the registered product key for the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteUserLicenseWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/users/me/license';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Delete user product key
  ///
  /// Delete the registered product key for the current user.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteUserLicense({Future<void>? abortTrigger}) async {
    final response = await deleteUserLicenseWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve user product key
  ///
  /// Retrieve information about whether the current user has a registered product key.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getUserLicenseWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/users/me/license';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve user product key
  ///
  /// Retrieve information about whether the current user has a registered product key.
  ///
  /// Available since server v1.0.0.
  Future<LicenseResponseDto> getUserLicense({Future<void>? abortTrigger}) async {
    final response = await getUserLicenseWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LicenseResponseDto')
          as LicenseResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Set user product key
  ///
  /// Register a product key for the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> setUserLicenseWithHttpInfo(LicenseKeyDto licenseKeyDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/users/me/license';

    Object? postBody = licenseKeyDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Set user product key
  ///
  /// Register a product key for the current user.
  ///
  /// Available since server v1.0.0.
  Future<LicenseResponseDto> setUserLicense(LicenseKeyDto licenseKeyDto, {Future<void>? abortTrigger}) async {
    final response = await setUserLicenseWithHttpInfo(licenseKeyDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LicenseResponseDto')
          as LicenseResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete user onboarding
  ///
  /// Delete the onboarding status of the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteUserOnboardingWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/users/me/onboarding';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Delete user onboarding
  ///
  /// Delete the onboarding status of the current user.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteUserOnboarding({Future<void>? abortTrigger}) async {
    final response = await deleteUserOnboardingWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve user onboarding
  ///
  /// Retrieve the onboarding status of the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getUserOnboardingWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/users/me/onboarding';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve user onboarding
  ///
  /// Retrieve the onboarding status of the current user.
  ///
  /// Available since server v1.0.0.
  Future<OnboardingResponseDto> getUserOnboarding({Future<void>? abortTrigger}) async {
    final response = await getUserOnboardingWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'OnboardingResponseDto')
          as OnboardingResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update user onboarding
  ///
  /// Update the onboarding status of the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> setUserOnboardingWithHttpInfo(OnboardingDto onboardingDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/users/me/onboarding';

    Object? postBody = onboardingDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Update user onboarding
  ///
  /// Update the onboarding status of the current user.
  ///
  /// Available since server v1.0.0.
  Future<OnboardingResponseDto> setUserOnboarding(OnboardingDto onboardingDto, {Future<void>? abortTrigger}) async {
    final response = await setUserOnboardingWithHttpInfo(onboardingDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'OnboardingResponseDto')
          as OnboardingResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get my preferences
  ///
  /// Retrieve the preferences for the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getMyPreferencesWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/users/me/preferences';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get my preferences
  ///
  /// Retrieve the preferences for the current user.
  ///
  /// Available since server v1.0.0.
  Future<UserPreferencesResponseDto> getMyPreferences({Future<void>? abortTrigger}) async {
    final response = await getMyPreferencesWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserPreferencesResponseDto')
          as UserPreferencesResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update my preferences
  ///
  /// Update the preferences of the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateMyPreferencesWithHttpInfo(
    UserPreferencesUpdateDto userPreferencesUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/users/me/preferences';

    Object? postBody = userPreferencesUpdateDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Update my preferences
  ///
  /// Update the preferences of the current user.
  ///
  /// Available since server v1.0.0.
  Future<UserPreferencesResponseDto> updateMyPreferences(
    UserPreferencesUpdateDto userPreferencesUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateMyPreferencesWithHttpInfo(userPreferencesUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserPreferencesResponseDto')
          as UserPreferencesResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete user profile image
  ///
  /// Delete the profile image of the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteProfileImageWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/users/profile-image';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Delete user profile image
  ///
  /// Delete the profile image of the current user.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteProfileImage({Future<void>? abortTrigger}) async {
    final response = await deleteProfileImageWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Create user profile image
  ///
  /// Upload and set a new profile image for the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createProfileImageWithHttpInfo(MultipartFile file, {Future<void>? abortTrigger}) async {
    final apiPath = r'/users/profile-image';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('POST', Uri.parse(apiPath));
    hasFields = true;
    mp.fields[r'file'] = file.field;
    mp.files.add(file);
    if (hasFields) {
      postBody = mp;
    }

    return apiClient.invokeAPI(
      apiPath,
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Create user profile image
  ///
  /// Upload and set a new profile image for the current user.
  ///
  /// Available since server v1.0.0.
  Future<CreateProfileImageResponseDto> createProfileImage(MultipartFile file, {Future<void>? abortTrigger}) async {
    final response = await createProfileImageWithHttpInfo(file, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'CreateProfileImageResponseDto')
          as CreateProfileImageResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve a user
  ///
  /// Retrieve a specific user by their ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getUserWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/users/{id}'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve a user
  ///
  /// Retrieve a specific user by their ID.
  ///
  /// Available since server v1.0.0.
  Future<UserResponseDto> getUser(String id, {Future<void>? abortTrigger}) async {
    final response = await getUserWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserResponseDto') as UserResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve user profile image
  ///
  /// Retrieve the profile image file for a user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getProfileImageWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/users/{id}/profile-image'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve user profile image
  ///
  /// Retrieve the profile image file for a user.
  ///
  /// Available since server v1.0.0.
  Future<Uint8List> getProfileImage(String id, {Future<void>? abortTrigger}) async {
    final response = await getProfileImageWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    return response.bodyBytes;
  }
}
