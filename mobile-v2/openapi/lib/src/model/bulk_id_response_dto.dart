//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'bulk_id_response_dto.g.dart';

/// BulkIdResponseDto
///
/// Properties:
/// * [error] 
/// * [id] 
/// * [success] 
@BuiltValue()
abstract class BulkIdResponseDto implements Built<BulkIdResponseDto, BulkIdResponseDtoBuilder> {
  @BuiltValueField(wireName: r'error')
  BulkIdResponseDtoErrorEnum? get error;
  // enum errorEnum {  duplicate,  no_permission,  not_found,  unknown,  };

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'success')
  bool get success;

  BulkIdResponseDto._();

  factory BulkIdResponseDto([void updates(BulkIdResponseDtoBuilder b)]) = _$BulkIdResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BulkIdResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BulkIdResponseDto> get serializer => _$BulkIdResponseDtoSerializer();
}

class _$BulkIdResponseDtoSerializer implements PrimitiveSerializer<BulkIdResponseDto> {
  @override
  final Iterable<Type> types = const [BulkIdResponseDto, _$BulkIdResponseDto];

  @override
  final String wireName = r'BulkIdResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BulkIdResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.error != null) {
      yield r'error';
      yield serializers.serialize(
        object.error,
        specifiedType: const FullType(BulkIdResponseDtoErrorEnum),
      );
    }
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'success';
    yield serializers.serialize(
      object.success,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BulkIdResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BulkIdResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'error':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BulkIdResponseDtoErrorEnum),
          ) as BulkIdResponseDtoErrorEnum;
          result.error = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'success':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.success = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BulkIdResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BulkIdResponseDtoBuilder();
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

class BulkIdResponseDtoErrorEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'duplicate')
  static const BulkIdResponseDtoErrorEnum duplicate = _$bulkIdResponseDtoErrorEnum_duplicate;
  @BuiltValueEnumConst(wireName: r'no_permission')
  static const BulkIdResponseDtoErrorEnum noPermission = _$bulkIdResponseDtoErrorEnum_noPermission;
  @BuiltValueEnumConst(wireName: r'not_found')
  static const BulkIdResponseDtoErrorEnum notFound = _$bulkIdResponseDtoErrorEnum_notFound;
  @BuiltValueEnumConst(wireName: r'unknown')
  static const BulkIdResponseDtoErrorEnum unknown = _$bulkIdResponseDtoErrorEnum_unknown;

  static Serializer<BulkIdResponseDtoErrorEnum> get serializer => _$bulkIdResponseDtoErrorEnumSerializer;

  const BulkIdResponseDtoErrorEnum._(String name): super(name);

  static BuiltSet<BulkIdResponseDtoErrorEnum> get values => _$bulkIdResponseDtoErrorEnumValues;
  static BulkIdResponseDtoErrorEnum valueOf(String name) => _$bulkIdResponseDtoErrorEnumValueOf(name);
}

