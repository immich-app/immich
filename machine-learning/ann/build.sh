#!/usr/bin/env sh

g++ -shared -O3 -o libann.so -fuse-ld=gold -std=c++17 -I"$ARMNN_PATH"/include -larmnn -larmnnDeserializer -larmnnTfLiteParser -larmnnOnnxParser -L"$ARMNN_PATH" ann.cpp
