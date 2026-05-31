// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigOAuthDto {
  const SystemConfigOAuthDto({
    required this.allowInsecureRequests,
    required this.autoLaunch,
    required this.autoRegister,
    required this.buttonText,
    required this.clientId,
    required this.clientSecret,
    required this.defaultStorageQuota,
    required this.enabled,
    required this.endSessionEndpoint,
    required this.issuerUrl,
    required this.mobileOverrideEnabled,
    required this.mobileRedirectUri,
    required this.profileSigningAlgorithm,
    required this.prompt,
    required this.roleClaim,
    required this.scope,
    required this.signingAlgorithm,
    required this.storageLabelClaim,
    required this.storageQuotaClaim,
    required this.timeout,
    required this.tokenEndpointAuthMethod,
  });

  /// Allow insecure requests
  final bool allowInsecureRequests;

  /// Auto launch
  final bool autoLaunch;

  /// Auto register
  final bool autoRegister;

  /// Button text
  final String buttonText;

  /// Client ID
  final String clientId;

  /// Client secret
  final String clientSecret;

  /// Default storage quota
  final int? defaultStorageQuota;

  /// Enabled
  final bool enabled;

  /// End session endpoint
  final String endSessionEndpoint;

  /// Issuer URL
  final String issuerUrl;

  /// Mobile override enabled
  final bool mobileOverrideEnabled;

  /// Mobile redirect URI (set to empty string to disable)
  final String mobileRedirectUri;

  /// Profile signing algorithm
  final String profileSigningAlgorithm;

  /// OAuth prompt parameter (e.g. select_account, login, consent)
  final String prompt;

  /// Role claim
  final String roleClaim;

  /// Scope
  final String scope;

  /// Signing algorithm
  final String signingAlgorithm;

  /// Storage label claim
  final String storageLabelClaim;

  /// Storage quota claim
  final String storageQuotaClaim;

  /// Timeout
  final int timeout;

  final OAuthTokenEndpointAuthMethod tokenEndpointAuthMethod;

  static const _undefined = Object();

  static SystemConfigOAuthDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigOAuthDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      allowInsecureRequests: json[r'allowInsecureRequests'] as bool,
      autoLaunch: json[r'autoLaunch'] as bool,
      autoRegister: json[r'autoRegister'] as bool,
      buttonText: json[r'buttonText'] as String,
      clientId: json[r'clientId'] as String,
      clientSecret: json[r'clientSecret'] as String,
      defaultStorageQuota: (json[r'defaultStorageQuota'] as int?),
      enabled: json[r'enabled'] as bool,
      endSessionEndpoint: json[r'endSessionEndpoint'] as String,
      issuerUrl: json[r'issuerUrl'] as String,
      mobileOverrideEnabled: json[r'mobileOverrideEnabled'] as bool,
      mobileRedirectUri: json[r'mobileRedirectUri'] as String,
      profileSigningAlgorithm: json[r'profileSigningAlgorithm'] as String,
      prompt: json[r'prompt'] as String,
      roleClaim: json[r'roleClaim'] as String,
      scope: json[r'scope'] as String,
      signingAlgorithm: json[r'signingAlgorithm'] as String,
      storageLabelClaim: json[r'storageLabelClaim'] as String,
      storageQuotaClaim: json[r'storageQuotaClaim'] as String,
      timeout: json[r'timeout'] as int,
      tokenEndpointAuthMethod: (OAuthTokenEndpointAuthMethod.fromJson(json[r'tokenEndpointAuthMethod']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'allowInsecureRequests'] = allowInsecureRequests;
    json[r'autoLaunch'] = autoLaunch;
    json[r'autoRegister'] = autoRegister;
    json[r'buttonText'] = buttonText;
    json[r'clientId'] = clientId;
    json[r'clientSecret'] = clientSecret;
    if (defaultStorageQuota != null) {
      json[r'defaultStorageQuota'] = defaultStorageQuota!;
    }
    json[r'enabled'] = enabled;
    json[r'endSessionEndpoint'] = endSessionEndpoint;
    json[r'issuerUrl'] = issuerUrl;
    json[r'mobileOverrideEnabled'] = mobileOverrideEnabled;
    json[r'mobileRedirectUri'] = mobileRedirectUri;
    json[r'profileSigningAlgorithm'] = profileSigningAlgorithm;
    json[r'prompt'] = prompt;
    json[r'roleClaim'] = roleClaim;
    json[r'scope'] = scope;
    json[r'signingAlgorithm'] = signingAlgorithm;
    json[r'storageLabelClaim'] = storageLabelClaim;
    json[r'storageQuotaClaim'] = storageQuotaClaim;
    json[r'timeout'] = timeout;
    json[r'tokenEndpointAuthMethod'] = tokenEndpointAuthMethod.toJson();
    return json;
  }

  SystemConfigOAuthDto copyWith({
    bool? allowInsecureRequests,
    bool? autoLaunch,
    bool? autoRegister,
    String? buttonText,
    String? clientId,
    String? clientSecret,
    Object? defaultStorageQuota = _undefined,
    bool? enabled,
    String? endSessionEndpoint,
    String? issuerUrl,
    bool? mobileOverrideEnabled,
    String? mobileRedirectUri,
    String? profileSigningAlgorithm,
    String? prompt,
    String? roleClaim,
    String? scope,
    String? signingAlgorithm,
    String? storageLabelClaim,
    String? storageQuotaClaim,
    int? timeout,
    OAuthTokenEndpointAuthMethod? tokenEndpointAuthMethod,
  }) {
    return .new(
      allowInsecureRequests: allowInsecureRequests ?? this.allowInsecureRequests,
      autoLaunch: autoLaunch ?? this.autoLaunch,
      autoRegister: autoRegister ?? this.autoRegister,
      buttonText: buttonText ?? this.buttonText,
      clientId: clientId ?? this.clientId,
      clientSecret: clientSecret ?? this.clientSecret,
      defaultStorageQuota: identical(defaultStorageQuota, _undefined)
          ? this.defaultStorageQuota
          : defaultStorageQuota as int?,
      enabled: enabled ?? this.enabled,
      endSessionEndpoint: endSessionEndpoint ?? this.endSessionEndpoint,
      issuerUrl: issuerUrl ?? this.issuerUrl,
      mobileOverrideEnabled: mobileOverrideEnabled ?? this.mobileOverrideEnabled,
      mobileRedirectUri: mobileRedirectUri ?? this.mobileRedirectUri,
      profileSigningAlgorithm: profileSigningAlgorithm ?? this.profileSigningAlgorithm,
      prompt: prompt ?? this.prompt,
      roleClaim: roleClaim ?? this.roleClaim,
      scope: scope ?? this.scope,
      signingAlgorithm: signingAlgorithm ?? this.signingAlgorithm,
      storageLabelClaim: storageLabelClaim ?? this.storageLabelClaim,
      storageQuotaClaim: storageQuotaClaim ?? this.storageQuotaClaim,
      timeout: timeout ?? this.timeout,
      tokenEndpointAuthMethod: tokenEndpointAuthMethod ?? this.tokenEndpointAuthMethod,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigOAuthDto &&
            allowInsecureRequests == other.allowInsecureRequests &&
            autoLaunch == other.autoLaunch &&
            autoRegister == other.autoRegister &&
            buttonText == other.buttonText &&
            clientId == other.clientId &&
            clientSecret == other.clientSecret &&
            defaultStorageQuota == other.defaultStorageQuota &&
            enabled == other.enabled &&
            endSessionEndpoint == other.endSessionEndpoint &&
            issuerUrl == other.issuerUrl &&
            mobileOverrideEnabled == other.mobileOverrideEnabled &&
            mobileRedirectUri == other.mobileRedirectUri &&
            profileSigningAlgorithm == other.profileSigningAlgorithm &&
            prompt == other.prompt &&
            roleClaim == other.roleClaim &&
            scope == other.scope &&
            signingAlgorithm == other.signingAlgorithm &&
            storageLabelClaim == other.storageLabelClaim &&
            storageQuotaClaim == other.storageQuotaClaim &&
            timeout == other.timeout &&
            tokenEndpointAuthMethod == other.tokenEndpointAuthMethod);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      allowInsecureRequests,
      autoLaunch,
      autoRegister,
      buttonText,
      clientId,
      clientSecret,
      defaultStorageQuota,
      enabled,
      endSessionEndpoint,
      issuerUrl,
      mobileOverrideEnabled,
      mobileRedirectUri,
      profileSigningAlgorithm,
      prompt,
      roleClaim,
      scope,
      signingAlgorithm,
      storageLabelClaim,
      storageQuotaClaim,
      timeout,
      tokenEndpointAuthMethod,
    ]);
  }

  @override
  String toString() =>
      'SystemConfigOAuthDto(allowInsecureRequests=$allowInsecureRequests, autoLaunch=$autoLaunch, autoRegister=$autoRegister, buttonText=$buttonText, clientId=$clientId, clientSecret=$clientSecret, defaultStorageQuota=$defaultStorageQuota, enabled=$enabled, endSessionEndpoint=$endSessionEndpoint, issuerUrl=$issuerUrl, mobileOverrideEnabled=$mobileOverrideEnabled, mobileRedirectUri=$mobileRedirectUri, profileSigningAlgorithm=$profileSigningAlgorithm, prompt=$prompt, roleClaim=$roleClaim, scope=$scope, signingAlgorithm=$signingAlgorithm, storageLabelClaim=$storageLabelClaim, storageQuotaClaim=$storageQuotaClaim, timeout=$timeout, tokenEndpointAuthMethod=$tokenEndpointAuthMethod)';
}
