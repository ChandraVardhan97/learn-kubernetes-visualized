#!/usr/bin/env bash
# Source this file in Bash to select the lab tools and kubeconfig for this shell.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo 'Run source ./lab-env.sh in Bash.' >&2
  exit 2
fi
if ! kv_lab_bundle=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P) ||
   [[ ! -s "$kv_lab_bundle/.kv-lab/kubeconfig" ]]; then
  echo 'The lab kubeconfig is missing. Run bash setup.sh from the extracted bundle first.' >&2
  unset kv_lab_bundle
  return 2
fi
case "$PATH" in
  "$kv_lab_bundle/.kv-lab/bin:"*) ;;
  *) export PATH="$kv_lab_bundle/.kv-lab/bin:$PATH" ;;
esac
export KUBECONFIG="$kv_lab_bundle/.kv-lab/kubeconfig"
export KIND_EXPERIMENTAL_PROVIDER=docker
unset kv_lab_bundle
