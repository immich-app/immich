//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'time_bucket_size.g.dart';

class TimeBucketSize extends EnumClass {

  @BuiltValueEnumConst(wireName: r'DAY')
  static const TimeBucketSize DAY = _$DAY;
  @BuiltValueEnumConst(wireName: r'MONTH')
  static const TimeBucketSize MONTH = _$MONTH;

  static Serializer<TimeBucketSize> get serializer => _$timeBucketSizeSerializer;

  const TimeBucketSize._(String name): super(name);

  static BuiltSet<TimeBucketSize> get values => _$values;
  static TimeBucketSize valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class TimeBucketSizeMixin = Object with _$TimeBucketSizeMixin;

