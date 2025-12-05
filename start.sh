#!/usr/bin/env bash

mode=${1:-both}

mkdir logs 2>/dev/null || true
now=$(date +"%Y%m%d-%H%M")
case "$mode" in
  backend|both)
    PORT=11001 deno task dev:backend |& tee logs/${now}-backend.log &
    ;;
  frontend|both)
    PORT=11002 deno task dev:frontend |& tee logs/${now}-frontend.log &
    ;;
  *)
    echo "Usage: $0 [backend|frontend|both]"
    exit 1
    ;;
esac

wait
