//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

library openapi.api;

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/utils/openapi_patching.dart';
import 'package:http/http.dart';
import 'package:intl/intl.dart';
import 'package:meta/meta.dart';

part 'api_client.dart';
part 'api_helper.dart';
part 'api_exception.dart';
part 'auth/authentication.dart';
part 'auth/api_key_auth.dart';
part 'auth/oauth.dart';
part 'auth/http_basic_auth.dart';
part 'auth/http_bearer_auth.dart';

part 'api/api_keys_api.dart';
part 'api/authentication_api.dart';
part 'api/server_api.dart';
part 'api/sessions_api.dart';
part 'api/users_api.dart';

part 'model/api_key_create_dto.dart';
part 'model/api_key_create_response_dto.dart';
part 'model/api_key_response_dto.dart';
part 'model/api_key_update_dto.dart';
part 'model/change_password_dto.dart';
part 'model/login_credential_dto.dart';
part 'model/login_response_dto.dart';
part 'model/logout_response_dto.dart';
part 'model/permission.dart';
part 'model/server_about_response_dto.dart';
part 'model/server_config_dto.dart';
part 'model/server_features_dto.dart';
part 'model/server_ping_response.dart';
part 'model/server_version_response_dto.dart';
part 'model/session_create_dto.dart';
part 'model/session_create_response_dto.dart';
part 'model/session_response_dto.dart';
part 'model/sign_up_dto.dart';
part 'model/user_admin_response_dto.dart';
part 'model/user_response_dto.dart';
part 'model/user_status.dart';
part 'model/user_update_me_dto.dart';
part 'model/validate_access_token_response_dto.dart';


/// An [ApiClient] instance that uses the default values obtained from
/// the OpenAPI specification file.
var defaultApiClient = ApiClient();

const _delimiters = {'csv': ',', 'ssv': ' ', 'tsv': '\t', 'pipes': '|'};
const _dateEpochMarker = 'epoch';
const _deepEquality = DeepCollectionEquality();
final _dateFormatter = DateFormat('yyyy-MM-dd');
final _regList = RegExp(r'^List<(.*)>$');
final _regSet = RegExp(r'^Set<(.*)>$');
final _regMap = RegExp(r'^Map<String,(.*)>$');

bool _isEpochMarker(String? pattern) => pattern == _dateEpochMarker || pattern == '/$_dateEpochMarker/';
