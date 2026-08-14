import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';

part 'auxilary_endpoint.model.freezed.dart';

@Freezed(fromJson: false, toJson: false)
abstract class AuxilaryEndpoint with _$AuxilaryEndpoint {
  const AuxilaryEndpoint._();

  const factory AuxilaryEndpoint({required String url, required AuxCheckStatus status}) = _AuxilaryEndpoint;

  factory AuxilaryEndpoint.fromMap(Map<String, dynamic> map) {
    return AuxilaryEndpoint(
      url: map['url'] as String,
      status: AuxCheckStatus.fromMap(map['status'] as Map<String, dynamic>),
    );
  }

  factory AuxilaryEndpoint.fromJson(String source) =>
      AuxilaryEndpoint.fromMap(json.decode(source) as Map<String, dynamic>);
}

// TODO(agg23): Should be an enum
@freezed
abstract class AuxCheckStatus with _$AuxCheckStatus {
  const AuxCheckStatus._();

  const factory AuxCheckStatus({required String name}) = _AuxCheckStatus;

  static const loading = AuxCheckStatus(name: 'loading');
  static const valid = AuxCheckStatus(name: 'valid');
  static const error = AuxCheckStatus(name: 'error');
  static const unknown = AuxCheckStatus(name: 'unknown');

  factory AuxCheckStatus.fromMap(Map<String, dynamic> map) {
    return AuxCheckStatus(name: map['name'] as String);
  }
}
