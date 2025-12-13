#!/usr/bin/env sh

cd armnn-23.11/ || exit
g++ -o ../armnnconverter -O1 -DARMNN_ONNX_PARSER -DARMNN_SERIALIZER -DARMNN_TF_LITE_PARSER -fuse-ld=gold -std=c++17 -Iinclude -Isrc/armnnUtils -Ithird-party -larmnn -larmnnDeserializer -larmnnTfLiteParser -larmnnOnnxParser -larmnnSerializer -L../armnn src/armnnConverter/ArmnnConverter.cpp
