## Quick Start
1. Start DB:
   ```bash
   docker compose up -d
   ```
   On first boot, db/init/01_schema.sql and db/init/02_seed.sql run automatically.
2. Verify:
    ```bash
    # list tables
    docker exec -it pg_local sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"'

    # count flights
    docker exec -it pg_local sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT COUNT(*) AS flights FROM flights;"'

    # show sample data
    docker exec -it pg_local sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT * FROM airports LIMIT 5;"'
    ```
## 中文解释
-  在docker中跑posgress的image，自动创建表，加载种子
-  verify的部分，是通过docker中的sh来执行psql命令

## Reset (rerun schema & seed)
```bash
docker compose down -v
docker compose up -d
```
