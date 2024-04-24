//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'check_existing_assets_dto.g.dart';

/// CheckExistingAssetsDto
///
/// Properties:
/// * [deviceAssetIds] 
/// * [deviceId] 
@BuiltValue()
abstract class CheckExistingAssetsDto implements Built<CheckExistingAssetsDto, CheckExistingAssetsDtoBuilder> {
  @BuiltValueField(wireName: r'deviceAssetIds')
  BuiltList<String> get deviceAssetIds;

  @BuiltValueField(wireName: r'deviceId')
  String get deviceId;

  CheckExistingAssetsDto._();

  factory CheckExistingAssetsDto([void updates(CheckExistingAssetsDtoBuilder b)]) = _$CheckExistingAssetsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CheckExistingAssetsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CheckExistingAssetsDto> get serializer => _$CheckExistingAssetsDtoSerializer();
}

class _$CheckExistingAssetsDtoSerializer implements PrimitiveSerializer<CheckExistingAssetsDto> {
  @override
  final Iterable<Type> types = const [CheckExistingAssetsDto, _$CheckExistingAssetsDto];

  @override
  final String wireName = r'CheckExistingAssetsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CheckExistingAssetsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'deviceAssetIds';
    yield serializers.serialize(
      object.deviceAssetIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'deviceId';
    yield serializers.serialize(
      object.deviceId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CheckExistingAssetsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CheckExistingAssetsDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'deviceAssetIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.deviceAssetIds.replace(valueDes);
          break;
        case r'deviceId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CheckExistingAssetsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CheckExistingAssetsDtoBuilder();
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

