#!/usr/bin/env bash
source "$(dirname "$0")/_traffic.sh"

[ "$(k get service m06 -o jsonpath='{.spec.selector.app}')" = m06 ]
wait_traffic HTTP_OK
k exec m06-client -- wget -qO- -T 2 http://m06
