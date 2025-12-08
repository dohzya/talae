backend: op run --env-file .env --env-file .env.local -- deno task dev:backend 2>&1 | tee logs/$(date +"%Y%m%d-%H%M")-backend.log
frontend: op run --env-file .env --env-file .env.local -- deno task dev:frontend 2>&1 | tee logs/$(date +"%Y%m%d-%H%M")-frontend.log
