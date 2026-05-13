# Redis caching for API responses
import os
import json
from functools import wraps
from fastapi import Request

# Redis connection (lazy-loaded)
redis_client = None

def get_redis():
    global redis_client
    if redis_client is not None:
        return redis_client
    
    try:
        import redis
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
        redis_client = redis.from_url(redis_url, decode_responses=True)
        redis_client.ping()
        print("Redis connected successfully")
        return redis_client
    except Exception as e:
        print(f"Redis connection failed: {e}")
        redis_client = None
        return None

def cache_response(key_prefix, expire_seconds=300):
    """Decorator to cache API responses in Redis"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not redis_client:
                return await func(*args, **kwargs)
            
            # Create cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}"
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Call original function
            result = await func(*args, **kwargs)
            
            # Store in cache
            try:
                redis_client.setex(
                    cache_key,
                    expire_seconds,
                    json.dumps(result, default=str)
                )
            except Exception as e:
                print(f"Cache set failed: {e}")
            
            return result
        return wrapper
    return decorator

# Cache invalidation helpers
def invalidate_cache(pattern):
    """Invalidate cache keys matching pattern"""
    if not redis_client:
        return
    try:
        keys = redis_client.keys(f"{pattern}*")
        if keys:
            redis_client.delete(*keys)
            print(f"Invalidated {len(keys)} cache keys")
    except Exception as e:
        print(f"Cache invalidation failed: {e}")

# Specific cache helpers for common patterns
def cache_materials():
    """Cache materials list for 10 minutes"""
    return cache_response("materials", expire_seconds=600)

def cache_settings():
    """Cache settings for 5 minutes"""
    return cache_response("settings", expire_seconds=300)

def cache_pricing():
    """Cache pricing for 5 minutes"""
    return cache_response("pricing", expire_seconds=300)

# Invalidate when data changes
def invalidate_materials_cache():
    invalidate_cache("materials")

def invalidate_settings_cache():
    invalidate_cache("settings")

def invalidate_pricing_cache():
    invalidate_cache("pricing")
