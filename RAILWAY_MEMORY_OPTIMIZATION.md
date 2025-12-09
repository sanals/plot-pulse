# Railway Memory Optimization Guide

## Problem: 502 Bad Gateway / Connection Refused Errors

These errors typically indicate:
1. **Out of Memory (OOM)**: Backend process is being killed by Railway when it exceeds memory limits
2. **Backend Crashes**: Application crashes due to memory issues or other errors
3. **Connection Timeouts**: Backend is too slow to respond due to resource constraints

## Root Causes

### 1. No JVM Memory Limits
- **Issue**: Dockerfile didn't set JVM memory limits
- **Impact**: JVM could use all available memory, causing OOM kills
- **Fix**: Added `-XX:MaxRAMPercentage=75.0` to use 75% of container memory

### 2. Unbounded Rate Limiter Cache
- **Issue**: `ConcurrentHashMap` in `RateLimitFilter` could grow indefinitely
- **Impact**: Memory leak from accumulating rate limit buckets
- **Fix**: Added cache size limit (10,000 entries) and periodic cleanup

### 3. Large Database Queries
- **Issue**: `/api/v1/plots/bounds` endpoint could return large datasets
- **Impact**: High memory usage when loading many plots
- **Fix**: Ensure pagination is used (already implemented)

## Solutions Implemented

### 1. JVM Memory Configuration (Dockerfile)

```dockerfile
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapdump.hprof"
```

**What this does:**
- `-XX:+UseContainerSupport`: Respects Railway's container memory limits
- `-XX:MaxRAMPercentage=75.0`: Uses 75% of available container memory for heap
  - On 512MB Railway instance: ~384MB heap
  - Leaves 25% for JVM overhead, metaspace, code cache, etc.
- `-XX:+ExitOnOutOfMemoryError`: Exits immediately on OOM (better than hanging)
- `-XX:+HeapDumpOnOutOfMemoryError`: Generates heap dump for debugging
- `-XX:HeapDumpPath`: Where to save heap dumps

### 2. Rate Limiter Memory Leak Prevention

**Changes made:**
- Maximum cache size: 10,000 buckets
- Automatic cleanup: Removes buckets not accessed in 1 hour
- Periodic cleanup: Runs every 5 minutes
- Graceful degradation: Uses temporary buckets when cache is full

**Memory impact:**
- Each bucket: ~1-2KB
- Maximum memory: ~10-20MB for rate limiter cache
- Automatic cleanup prevents unbounded growth

### 3. Database Connection Pool Optimization

Already configured in `application-prod.yml`:
```yaml
hikari:
  maximum-pool-size: 10  # Limit concurrent connections
  minimum-idle: 5
  connection-timeout: 60000
  idle-timeout: 600000
  max-lifetime: 1800000
```

## Railway Memory Configuration

### Check Current Memory Usage

1. **Railway Dashboard**:
   - Go to your backend service
   - Check **"Metrics"** tab
   - Look for memory usage graphs

2. **Service Logs**:
   - Check for OOM errors: `OutOfMemoryError`
   - Check for kill signals: `SIGKILL` or `killed`
   - Look for memory warnings

### Railway Memory Limits

**Free Tier:**
- Default: 512MB RAM
- Can be increased in service settings

**Paid Tiers:**
- Starter: 512MB - 2GB
- Developer: 2GB - 8GB
- Pro: 8GB+

### Increase Memory (If Needed)

1. Go to Railway Dashboard → Your Service
2. Click **"Settings"** tab
3. Find **"Resources"** or **"Scaling"** section
4. Increase **"Memory"** limit
5. Redeploy the service

## Monitoring Memory Usage

### 1. Railway Metrics

Check Railway dashboard for:
- Memory usage over time
- CPU usage
- Request count
- Error rate

### 2. Application Logs

Look for these indicators:
```
OutOfMemoryError
java.lang.OutOfMemoryError: Java heap space
killed
SIGKILL
```

### 3. Health Endpoint

Add memory info to `/api/v1/health` endpoint (if not already present):
```java
@GetMapping("/health")
public ResponseEntity<Map<String, Object>> health() {
    Runtime runtime = Runtime.getRuntime();
    long maxMemory = runtime.maxMemory();
    long totalMemory = runtime.totalMemory();
    long freeMemory = runtime.freeMemory();
    long usedMemory = totalMemory - freeMemory;
    
    Map<String, Object> health = new HashMap<>();
    health.put("status", "UP");
    health.put("memory", Map.of(
        "max", maxMemory,
        "total", totalMemory,
        "free", freeMemory,
        "used", usedMemory,
        "usedPercent", (usedMemory * 100.0 / maxMemory)
    ));
    return ResponseEntity.ok(health);
}
```

## Best Practices

### 1. Monitor Memory Usage
- Set up alerts for high memory usage (>80%)
- Monitor rate limiter cache size
- Track database connection pool usage

### 2. Optimize Queries
- Use pagination for large datasets
- Limit result sets
- Use database indexes
- Avoid loading unnecessary data

### 3. Reduce Memory Footprint
- Use streaming for large responses
- Limit response sizes
- Cache only essential data
- Clean up resources promptly

### 4. Handle OOM Gracefully
- Exit immediately on OOM (already configured)
- Generate heap dumps for analysis
- Set up auto-restart policies
- Monitor restart frequency

## Troubleshooting

### Issue: Still Getting 502 Errors

**Check:**
1. Railway service is running (not crashed)
2. Database connection is working
3. Memory usage is below limits
4. No infinite loops or memory leaks

**Actions:**
1. Check Railway logs for errors
2. Verify environment variables are set
3. Check database service status
4. Review recent code changes

### Issue: High Memory Usage

**Check:**
1. Rate limiter cache size (should be < 10,000)
2. Database connection pool (should be < 10 active)
3. Large query results
4. Memory leaks in code

**Actions:**
1. Review heap dump (if generated)
2. Check for unbounded collections
3. Review query pagination
4. Consider increasing Railway memory limit

### Issue: Frequent Restarts

**Check:**
1. OOM errors in logs
2. Memory limit too low
3. Memory leaks
4. High traffic causing memory spikes

**Actions:**
1. Increase Railway memory limit
2. Fix memory leaks
3. Optimize queries
4. Add more aggressive cleanup

## Next Steps

1. **Deploy the updated Dockerfile** with JVM memory settings
2. **Monitor memory usage** after deployment
3. **Check logs** for OOM errors
4. **Adjust memory limits** if needed
5. **Review heap dumps** if OOM occurs

## Additional Resources

- [Railway Memory Limits](https://docs.railway.app/reference/limits)
- [JVM Memory Tuning](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/)
- [Spring Boot Memory Optimization](https://spring.io/guides/gs/spring-boot-docker/)

