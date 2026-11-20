#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"

bash start.sh
k patch service m06 --type merge -p '{"spec":{"selector":{"app":"m06"}}}'
bash verify.sh
