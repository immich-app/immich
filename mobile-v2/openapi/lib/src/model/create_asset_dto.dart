//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'dart:typed_data';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_asset_dto.g.dart';

/// CreateAssetDto
///
/// Properties:
/// * [assetData] 
/// * [deviceAssetId] 
/// * [deviceId] 
/// * [duration] 
/// * [fileCreatedAt] 
/// * [fileModifiedAt] 
/// * [isArchived] 
/// * [isFavorite] 
/// * [isOffline] 
/// * [isReadOnly] 
/// * [isVisible] 
/// * [libraryId] 
/// * [livePhotoData] 
/// * [sidecarData] 
@BuiltValue()
abstract class CreateAssetDto implements Built<CreateAssetDto, CreateAssetDtoBuilder> {
  @BuiltValueField(wireName: r'assetData')
  Uint8List get assetData;

  @BuiltValueField(wireName: r'deviceAssetId')
  String get deviceAssetId;

  @BuiltValueField(wireName: r'deviceId')
  String get deviceId;

  @BuiltValueField(wireName: r'duration')
  String? get duration;

  @BuiltValueField(wireName: r'fileCreatedAt')
  DateTime get fileCreatedAt;

  @BuiltValueField(wireName: r'fileModifiedAt')
  DateTime get fileModifiedAt;

  @BuiltValueField(wireName: r'isArchived')
  bool? get isArchived;

  @BuiltValueField(wireName: r'isFavorite')
  bool? get isFavorite;

  @BuiltValueField(wireName: r'isOffline')
  bool? get isOffline;

  @BuiltValueField(wireName: r'isReadOnly')
  bool? get isReadOnly;

  @BuiltValueField(wireName: r'isVisible')
  bool? get isVisible;

  @BuiltValueField(wireName: r'libraryId')
  String? get libraryId;

  @BuiltValueField(wireName: r'livePhotoData')
  Uint8List? get livePhotoData;

  @BuiltValueField(wireName: r'sidecarData')
  Uint8List? get sidecarData;

  CreateAssetDto._();

  factory CreateAssetDto([void updates(CreateAssetDtoBuilder b)]) = _$CreateAssetDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateAssetDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateAssetDto> get serializer => _$CreateAssetDtoSerializer();
}

class _$CreateAssetDtoSerializer implements PrimitiveSerializer<CreateAssetDto> {
  @override
  final Iterable<Type> types = const [CreateAssetDto, _$CreateAssetDto];

  @override
  final String wireName = r'CreateAssetDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateAssetDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assetData';
    yield serializers.serialize(
      object.assetData,
      specifiedType: const FullType(Uint8List),
    );
    yield r'deviceAssetId';
    yield serializers.serialize(
      object.deviceAssetId,
      specifiedType: const FullType(String),
    );
    yield r'deviceId';
    yield serializers.serialize(
      object.deviceId,
      specifiedType: const FullType(String),
    );
    if (object.duration != null) {
      yield r'duration';
      yield serializers.serialize(
        object.duration,
        specifiedType: const FullType(String),
      );
    }
    yield r'fileCreatedAt';
    yield serializers.serialize(
      object.fileCreatedAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'fileModifiedAt';
    yield serializers.serialize(
      object.fileModifiedAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.isArchived != null) {
      yield r'isArchived';
      yield serializers.serialize(
        object.isArchived,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isFavorite != null) {
      yield r'isFavorite';
      yield serializers.serialize(
        object.isFavorite,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isOffline != null) {
      yield r'isOffline';
      yield serializers.serialize(
        object.isOffline,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isReadOnly != null) {
      yield r'isReadOnly';
      yield serializers.serialize(
        object.isReadOnly,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isVisible != null) {
      yield r'isVisible';
      yield serializers.serialize(
        object.isVisible,
        specifiedType: const FullType(bool),
      );
    }
    if (object.libraryId != null) {
      yield r'libraryId';
      yield serializers.serialize(
        object.libraryId,
        specifiedType: const FullType(String),
      );
    }
    if (object.livePhotoData != null) {
      yield r'livePhotoData';
      yield serializers.serialize(
        object.livePhotoData,
        specifiedType: const FullType(Uint8List),
      );
    }
    if (object.sidecarData != null) {
      yield r'sidecarData';
      yield serializers.serialize(
        object.sidecarData,
        specifiedType: const FullType(Uint8List),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateAssetDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateAssetDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assetData':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Uint8List),
          ) as Uint8List;
          result.assetData = valueDes;
          break;
        case r'deviceAssetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceAssetId = valueDes;
          break;
        case r'deviceId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceId = valueDes;
          break;
        case r'duration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.duration = valueDes;
          break;
        case r'fileCreatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.fileCreatedAt = valueDes;
          break;
        case r'fileModifiedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.fileModifiedAt = valueDes;
          break;
        case r'isArchived':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isArchived = valueDes;
          break;
        case r'isFavorite':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isFavorite = valueDes;
          break;
        case r'isOffline':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isOffline = valueDes;
          break;
        case r'isReadOnly':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isReadOnly = valueDes;
          break;
        case r'isVisible':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isVisible = valueDes;
          break;
        case r'libraryId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.libraryId = valueDes;
          break;
        case r'livePhotoData':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Uint8List),
          ) as Uint8List;
          result.livePhotoData = valueDes;
          break;
        case r'sidecarData':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Uint8List),
          ) as Uint8List;
          result.sidecarData = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateAssetDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateAssetDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

