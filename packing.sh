#!/usr/bin/env bash

[ -f extension.zip ] && rm -v extension.zip
zip -r extension.zip ./*.js ./*.json ./*.html ./images/ev_*.png ./ExifReader-src/
