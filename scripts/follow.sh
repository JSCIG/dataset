#!/bin/bash
set -euo pipefail
PATH="$(npm bin):$PATH"
set -x
mkdir dist
pushd dist || exit 1
ts-node ../src/fetch.ts
popd || exit 1
