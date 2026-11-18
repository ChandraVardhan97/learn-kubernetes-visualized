#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
bash capstone-stateless.sh
bash capstone-stateful.sh
bash capstone-platform.sh
