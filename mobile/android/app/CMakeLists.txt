
cmake_minimum_required(VERSION 3.10.2)
project("native_buffer")

add_library(native_buffer SHARED
    src/main/cpp/native_buffer.c)

find_library(log-lib log)

target_link_libraries(native_buffer ${log-lib})
