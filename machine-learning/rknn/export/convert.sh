#!/bin/bash

python3 build_rknn.py "$1" "$2" > immich_to_rknn2.log

# if "No lowering found for" found in log file, return error status 1
if grep -q "No lowering found for" immich_to_rknn2.log; then
    echo -e "\e[31mSome operations are not supported by RKNN, please check the log file for details.\e[0m"
    exit 1
else
    echo -e "\e[32mConversion completed successfully.\e[0m"
    rm immich_to_rknn2.log
    exit 0
fi
