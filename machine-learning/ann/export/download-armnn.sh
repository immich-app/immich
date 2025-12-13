#!/bin/sh

# binaries
mkdir armnn
curl -SL "https://github.com/ARM-software/armnn/releases/download/v23.11/ArmNN-linux-x86_64.tar.gz" | tar -zx -C armnn

# source to build ArmnnConverter
curl -SL "https://github.com/ARM-software/armnn/archive/refs/tags/v23.11.tar.gz" | tar -zx
