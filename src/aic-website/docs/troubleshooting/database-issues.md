# Database Issues Troubleshooting

## PostgreSQL Issues

### 1. Connection Problems

#### Symptoms
- Connection refused errors
- Too many connections
- Authentication failures

#### Diagnosis
```bash
# Test database connectivity
kubectl exec -it <app-pod> -n <namespace> -- pg_isready -h postgresql -p 5432

# Check connection count
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check PostgreSQL logs
kubectl logs postgresql-0 -n storage | tail -100

# Verify credentials
kubectl get secret postgresql-secret -n storage -o yaml
```

#### Solutions
```bash
# Restart PostgreSQL
kubectl rollout restart statefulset/postgresql -n storage

# Increase max connections
kubectl exec -it postgresql-0 -n storage -- psql -c "ALTER SYSTEM SET max_connections = 200;"
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT pg_reload_conf();"

# Check connection pool settings
kubectl get configmap backend-api-config -n backend-services -o yaml | grep -A 10 database

# Kill idle connections
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '1 hour';"
```

### 2. Performance Issues

#### Symptoms
- Slow query execution
- High CPU usage
- Lock contention

#### Diagnosis
```bash
# Check slow queries
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check active queries
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"

# Check locks
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Check database size
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT pg_size_pretty(pg_database_size('aic_production'));"
```

#### Solutions
```bash
# Analyze and vacuum tables
kubectl exec -it postgresql-0 -n storage -- psql -c "VACUUM ANALYZE;"

# Update statistics
kubectl exec -it postgresql-0 -n storage -- psql -c "ANALYZE;"

# Check and create indexes
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0;"

# Increase shared buffers
kubectl exec -it postgresql-0 -n storage -- psql -c "ALTER SYSTEM SET shared_buffers = '256MB';"
kubectl rollout restart statefulset/postgresql -n storage
```

### 3. Replication Issues

#### Symptoms
- Replica lag
- Replication slot issues
- Synchronization failures

#### Diagnosis
```bash
# Check replication status
kubectl exec -it postgresql-primary-0 -n storage -- psql -c "SELECT * FROM pg_stat_replication;"

# Check replica lag
kubectl exec -it postgresql-replica-0 -n storage -- psql -c "SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn(), pg_last_xact_replay_timestamp();"

# Check replication slots
kubectl exec -it postgresql-primary-0 -n storage -- psql -c "SELECT * FROM pg_replication_slots;"

# Check WAL files
kubectl exec -it postgresql-primary-0 -n storage -- ls -la /var/lib/postgresql/data/pg_wal/
```

#### Solutions
```bash
# Restart replica
kubectl rollout restart statefulset/postgresql-replica -n storage

# Recreate replication slot
kubectl exec -it postgresql-primary-0 -n storage -- psql -c "SELECT pg_drop_replication_slot('replica_slot');"
kubectl exec -it postgresql-primary-0 -n storage -- psql -c "SELECT pg_create_physical_replication_slot('replica_slot');"

# Check network connectivity
kubectl exec -it postgresql-replica-0 -n storage -- ping postgresql-primary-0.postgresql-primary.storage.svc.cluster.local

# Increase WAL retention
kubectl exec -it postgresql-primary-0 -n storage -- psql -c "ALTER SYSTEM SET wal_keep_segments = 64;"
```

### 4. Storage Issues

#### Symptoms
- Disk space full
- I/O performance problems
- Backup failures

#### Diagnosis
```bash
# Check disk usage
kubectl exec -it postgresql-0 -n storage -- df -h

# Check database size
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database;"

# Check table sizes
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"

# Check I/O statistics
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT * FROM pg_stat_bgwriter;"
```

#### Solutions
```bash
# Expand PVC
kubectl patch pvc postgresql-data -n storage -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'

# Clean up old WAL files
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT pg_switch_wal();"

# Vacuum full for space reclaim
kubectl exec -it postgresql-0 -n storage -- psql -c "VACUUM FULL;"

# Archive old data
kubectl exec -it postgresql-0 -n storage -- psql -c "DELETE FROM audit_logs WHERE created_at < now() - interval '90 days';"
```

## Redis Issues

### 1. Connection and Memory Issues

#### Symptoms
- Redis connection failures
- Out of memory errors
- High memory usage

#### Diagnosis
```bash
# Test Redis connectivity
kubectl exec -it redis-0 -n storage -- redis-cli ping

# Check memory usage
kubectl exec -it redis-0 -n storage -- redis-cli INFO memory

# Check connected clients
kubectl exec -it redis-0 -n storage -- redis-cli INFO clients

# Check key statistics
kubectl exec -it redis-0 -n storage -- redis-cli INFO keyspace
```

#### Solutions
```bash
# Restart Redis
kubectl rollout restart statefulset/redis -n storage

# Increase memory limit
kubectl patch statefulset redis -n storage -p '{"spec":{"template":{"spec":{"containers":[{"name":"redis","resources":{"limits":{"memory":"2Gi"}}}]}}}}'

# Clear cache
kubectl exec -it redis-0 -n storage -- redis-cli FLUSHDB

# Set memory policy
kubectl exec -it redis-0 -n storage -- redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 2. Performance Issues

#### Symptoms
- Slow Redis operations
- High CPU usage
- Command timeouts

#### Diagnosis
```bash
# Check slow log
kubectl exec -it redis-0 -n storage -- redis-cli SLOWLOG GET 10

# Monitor commands
kubectl exec -it redis-0 -n storage -- redis-cli MONITOR

# Check statistics
kubectl exec -it redis-0 -n storage -- redis-cli INFO stats

# Check configuration
kubectl exec -it redis-0 -n storage -- redis-cli CONFIG GET "*"
```

#### Solutions
```bash
# Optimize configuration
kubectl exec -it redis-0 -n storage -- redis-cli CONFIG SET timeout 300
kubectl exec -it redis-0 -n storage -- redis-cli CONFIG SET tcp-keepalive 60

# Clear slow log
kubectl exec -it redis-0 -n storage -- redis-cli SLOWLOG RESET

# Optimize key patterns
kubectl exec -it redis-0 -n storage -- redis-cli --bigkeys

# Enable persistence optimization
kubectl exec -it redis-0 -n storage -- redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

### 3. Clustering Issues

#### Symptoms
- Cluster node failures
- Split-brain scenarios
- Failover problems

#### Diagnosis
```bash
# Check cluster status
kubectl exec -it redis-0 -n storage -- redis-cli CLUSTER NODES

# Check cluster info
kubectl exec -it redis-0 -n storage -- redis-cli CLUSTER INFO

# Check replication
kubectl exec -it redis-0 -n storage -- redis-cli INFO replication

# Test cluster connectivity
kubectl exec -it redis-0 -n storage -- redis-cli -c SET test-key test-value
```

#### Solutions
```bash
# Fix cluster configuration
kubectl exec -it redis-0 -n storage -- redis-cli CLUSTER RESET HARD

# Rejoin cluster
kubectl exec -it redis-1 -n storage -- redis-cli CLUSTER MEET redis-0.redis.storage.svc.cluster.local 6379

# Rebalance slots
kubectl exec -it redis-0 -n storage -- redis-cli --cluster rebalance redis-0.redis.storage.svc.cluster.local:6379

# Force failover
kubectl exec -it redis-1 -n storage -- redis-cli CLUSTER FAILOVER FORCE
```

## MongoDB Issues

### 1. Connection and Authentication

#### Symptoms
- Authentication failures
- Connection timeouts
- Replica set issues

#### Diagnosis
```bash
# Test MongoDB connectivity
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.adminCommand('ping')"

# Check replica set status
kubectl exec -it mongodb-0 -n storage -- mongo --eval "rs.status()"

# Check authentication
kubectl exec -it mongodb-0 -n storage -- mongo -u admin -p --authenticationDatabase admin --eval "db.adminCommand('listUsers')"

# Check logs
kubectl logs mongodb-0 -n storage | tail -100
```

#### Solutions
```bash
# Restart MongoDB
kubectl rollout restart statefulset/mongodb -n storage

# Reconfigure replica set
kubectl exec -it mongodb-0 -n storage -- mongo --eval "rs.reconfig({_id: 'rs0', members: [{_id: 0, host: 'mongodb-0.mongodb.storage.svc.cluster.local:27017'}, {_id: 1, host: 'mongodb-1.mongodb.storage.svc.cluster.local:27017'}, {_id: 2, host: 'mongodb-2.mongodb.storage.svc.cluster.local:27017'}]})"

# Reset user passwords
kubectl exec -it mongodb-0 -n storage -- mongo -u admin -p --authenticationDatabase admin --eval "db.changeUserPassword('appuser', 'newpassword')"

# Check network connectivity
kubectl exec -it mongodb-0 -n storage -- ping mongodb-1.mongodb.storage.svc.cluster.local
```

### 2. Performance Issues

#### Symptoms
- Slow queries
- High memory usage
- Index problems

#### Diagnosis
```bash
# Check slow queries
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.setProfilingLevel(2, {slowms: 100})"
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.system.profile.find().limit(5).sort({ts: -1}).pretty()"

# Check database statistics
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.stats()"

# Check index usage
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.collection.getIndexes()"

# Check memory usage
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.serverStatus().mem"
```

#### Solutions
```bash
# Create indexes
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.collection.createIndex({field: 1})"

# Compact database
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.runCommand({compact: 'collection'})"

# Increase cache size
kubectl patch statefulset mongodb -n storage -p '{"spec":{"template":{"spec":{"containers":[{"name":"mongodb","args":["--wiredTigerCacheSizeGB=2"]}]}}}}'

# Optimize queries
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.collection.find({field: value}).explain('executionStats')"
```

### 3. Replica Set Issues

#### Symptoms
- Primary election failures
- Replication lag
- Split-brain scenarios

#### Diagnosis
```bash
# Check replica set configuration
kubectl exec -it mongodb-0 -n storage -- mongo --eval "rs.conf()"

# Check replication lag
kubectl exec -it mongodb-0 -n storage -- mongo --eval "rs.printSlaveReplicationInfo()"

# Check oplog size
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.oplog.rs.stats()"

# Check member health
kubectl exec -it mongodb-0 -n storage -- mongo --eval "rs.status().members.forEach(function(member) { print(member.name + ': ' + member.stateStr); })"
```

#### Solutions
```bash
# Force primary election
kubectl exec -it mongodb-1 -n storage -- mongo --eval "rs.stepDown()"

# Reconfigure replica set
kubectl exec -it mongodb-0 -n storage -- mongo --eval "cfg = rs.conf(); cfg.members[1].priority = 0.5; rs.reconfig(cfg)"

# Resync member
kubectl exec -it mongodb-2 -n storage -- mongo --eval "rs.syncFrom('mongodb-0.mongodb.storage.svc.cluster.local:27017')"

# Increase oplog size
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.adminCommand({replSetResizeOplog: 1, size: 2048})"
```

## Database Backup and Recovery

### 1. PostgreSQL Backup

```bash
# Create backup
kubectl exec -it postgresql-0 -n storage -- pg_dump -U postgres aic_production > backup.sql

# Restore from backup
kubectl exec -i postgresql-0 -n storage -- psql -U postgres aic_production < backup.sql

# Point-in-time recovery
kubectl exec -it postgresql-0 -n storage -- pg_basebackup -D /backup -Ft -z -P -U postgres

# Continuous archiving
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT pg_start_backup('backup-$(date +%Y%m%d)');"
```

### 2. Redis Backup

```bash
# Create RDB snapshot
kubectl exec -it redis-0 -n storage -- redis-cli BGSAVE

# Copy backup file
kubectl cp redis-0:/data/dump.rdb ./redis-backup.rdb -n storage

# Restore from backup
kubectl cp ./redis-backup.rdb redis-0:/data/dump.rdb -n storage
kubectl rollout restart statefulset/redis -n storage
```

### 3. MongoDB Backup

```bash
# Create backup
kubectl exec -it mongodb-0 -n storage -- mongodump --out /backup

# Restore from backup
kubectl exec -it mongodb-0 -n storage -- mongorestore /backup

# Oplog backup
kubectl exec -it mongodb-0 -n storage -- mongodump --oplog --out /backup/oplog
```

## Monitoring Database Health

### 1. PostgreSQL Monitoring

```bash
# Connection monitoring
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Performance monitoring
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT * FROM pg_stat_database WHERE datname = 'aic_production';"

# Lock monitoring
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT * FROM pg_stat_activity WHERE wait_event IS NOT NULL;"
```

### 2. Redis Monitoring

```bash
# Performance metrics
kubectl exec -it redis-0 -n storage -- redis-cli INFO stats | grep -E "total_commands_processed|total_connections_received|keyspace_hits|keyspace_misses"

# Memory monitoring
kubectl exec -it redis-0 -n storage -- redis-cli INFO memory | grep -E "used_memory_human|used_memory_peak_human|maxmemory_human"

# Client monitoring
kubectl exec -it redis-0 -n storage -- redis-cli CLIENT LIST
```

### 3. MongoDB Monitoring

```bash
# Database statistics
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.serverStatus()"

# Replica set monitoring
kubectl exec -it mongodb-0 -n storage -- mongo --eval "rs.status()"

# Performance monitoring
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.currentOp()"
```

## Emergency Procedures

### 1. Database Recovery

```bash
# Emergency PostgreSQL recovery
kubectl scale statefulset postgresql --replicas=0 -n storage
kubectl scale statefulset postgresql --replicas=1 -n storage

# Emergency Redis recovery
kubectl exec -it redis-0 -n storage -- redis-cli DEBUG RESTART

# Emergency MongoDB recovery
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.adminCommand({shutdown: 1})"
kubectl rollout restart statefulset/mongodb -n storage
```

### 2. Data Corruption Recovery

```bash
# PostgreSQL corruption recovery
kubectl exec -it postgresql-0 -n storage -- pg_resetwal /var/lib/postgresql/data

# Redis corruption recovery
kubectl exec -it redis-0 -n storage -- redis-cli DEBUG RESTART NOSAVE

# MongoDB corruption recovery
kubectl exec -it mongodb-0 -n storage -- mongod --repair --dbpath /data/db
```

---

**Next**: [Configuration Issues](./configuration-issues.md)
