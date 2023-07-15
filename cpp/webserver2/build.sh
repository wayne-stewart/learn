#!/bin/sh
clear

WARN="-Wall -Wextra"
CFLAGS="-fno-rtti -fno-exceptions"
#LFLAGS="-nodefaultlibs -nostartfiles"
LFLAGS="-pthread"
SRC=./src/nexus_server.cpp
OUT=./build/nexus_server

if [ -d "build" ]; then
    rm build/*
else
    mkdir "build"
fi

if gcc $SRC $WARN $FLAGS -o $OUT $LFLAGS; then
./build/nexus_server
fi
