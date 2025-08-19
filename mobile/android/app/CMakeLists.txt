cmake_minimum_required(VERSION 3.12)

set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)

project(native_buffer LANGUAGES C)

add_library(native_buffer SHARED
    src/main/cpp/native_buffer.c
)
