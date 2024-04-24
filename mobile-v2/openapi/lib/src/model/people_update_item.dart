//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/date.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'people_update_item.g.dart';

/// PeopleUpdateItem
///
/// Properties:
/// * [birthDate] - Person date of birth. Note: the mobile app cannot currently set the birth date to null.
/// * [featureFaceAssetId] - Asset is used to get the feature face thumbnail.
/// * [id] - Person id.
/// * [isHidden] - Person visibility
/// * [name] - Person name.
@BuiltValue()
abstract class PeopleUpdateItem implements Built<PeopleUpdateItem, PeopleUpdateItemBuilder> {
  /// Person date of birth. Note: the mobile app cannot currently set the birth date to null.
  @BuiltValueField(wireName: r'birthDate')
  Date? get birthDate;

  /// Asset is used to get the feature face thumbnail.
  @BuiltValueField(wireName: r'featureFaceAssetId')
  String? get featureFaceAssetId;

  /// Person id.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Person visibility
  @BuiltValueField(wireName: r'isHidden')
  bool? get isHidden;

  /// Person name.
  @BuiltValueField(wireName: r'name')
  String? get name;

  PeopleUpdateItem._();

  factory PeopleUpdateItem([void updates(PeopleUpdateItemBuilder b)]) = _$PeopleUpdateItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PeopleUpdateItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PeopleUpdateItem> get serializer => _$PeopleUpdateItemSerializer();
}

class _$PeopleUpdateItemSerializer implements PrimitiveSerializer<PeopleUpdateItem> {
  @override
  final Iterable<Type> types = const [PeopleUpdateItem, _$PeopleUpdateItem];

  @override
  final String wireName = r'PeopleUpdateItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PeopleUpdateItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.birthDate != null) {
      yield r'birthDate';
      yield serializers.serialize(
        object.birthDate,
        specifiedType: const FullType.nullable(Date),
      );
    }
    if (object.featureFaceAssetId != null) {
      yield r'featureFaceAssetId';
      yield serializers.serialize(
        object.featureFaceAssetId,
        specifiedType: const FullType(String),
      );
    }
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    if (object.isHidden != null) {
      yield r'isHidden';
      yield serializers.serialize(
        object.isHidden,
        specifiedType: const FullType(bool),
      );
    }
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    PeopleUpdateItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PeopleUpdateItemBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'birthDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(Date),
          ) as Date?;
          if (valueDes == null) continue;
          result.birthDate = valueDes;
          break;
        case r'featureFaceAssetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.featureFaceAssetId = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'isHidden':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isHidden = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PeopleUpdateItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PeopleUpdateItemBuilder();
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

