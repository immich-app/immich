#!/usr/bin/env sh

g++ -shared -fPIC -O3 -o libann.so -std=c++17 -I"$ARMNN_PATH"/include ann.cpp -L"$ARMNN_PATH" -larmnn -larmnnDeserializer
