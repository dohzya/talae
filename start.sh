#!/usr/bin/env bash

mkdir logs 2>/dev/null || true
now=$(date +"%Y%m%d-%H%M")
PORT=11001 deno task dev:backend |& tee logs/${now}-backend.log &
PORT=11002 deno task dev:frontend |& tee logs/${now}-frontend.log &

wait
