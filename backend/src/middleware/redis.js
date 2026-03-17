const path = require('path');
const { createClient } = require('redis');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const redisEnabled = process.env.REDIS_ENABLED !== 'false';
const redisUrl = process.env.REDIS_URL ? process.env.REDIS_URL.trim() : '';
const redisHost = process.env.REDIS_HOST ? process.env.REDIS_HOST.trim() : '';
const redisPort = Number(process.env.REDIS_PORT || 6379);
const redisUsername = process.env.REDIS_USERNAME ? process.env.REDIS_USERNAME.trim() : undefined;
const redisPassword = process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD.trim() : undefined;
const redisTls = ['1', 'true', 'yes'].includes((process.env.REDIS_TLS || '').toLowerCase());

const hasCredentials = Boolean(redisUsername || redisPassword);
const hasExplicitTarget = Boolean(redisUrl || redisHost);
const shouldUseRedis = redisEnabled && (hasExplicitTarget || hasCredentials);

let client = null;

if (shouldUseRedis) {
    const socketConfig = {
        host: redisHost || '127.0.0.1',
        port: redisPort
    };

    if (redisTls) {
        socketConfig.tls = true;
    }

    if (!hasExplicitTarget && hasCredentials) {
        console.log(`Redis host not set; defaulting to ${socketConfig.host}:${socketConfig.port}.`);
    }

    client = redisUrl
        ? createClient({ url: redisUrl })
        : createClient({
            username: redisUsername,
            password: redisPassword,
            socket: socketConfig
        });

    client.on('ready', () => {
        console.log('Redis connected and cache enabled.');
    });

    client.on('error', err => {
        console.error('Redis Client Error:', err.message);
    });

    client.connect().catch(err => {
        console.log('Redis connection failed, cache disabled:', err.message);
    });
} else {
    console.log('Redis disabled or not configured; set REDIS_URL or REDIS_HOST to enable cache.');
}

// Cache middleware
const cache = async (req, res, next) => {
    try {
        if (!client || !client.isOpen) {
            return next();
        }

        // Create cache key based on request URL
        const key = `cache:${req.originalUrl}`;
        console.log(`Redis cache: Checking key ${key}`);
        
        // Check if data exists in cache
        const cachedData = await client.get(key);
        
        if (cachedData) {
            console.log(`Redis cache: HIT for ${key}`);
            console.log(`Redis cache: Returning cached data`);
            
            // If data exists, send it and end response
            res.status(200).json(JSON.parse(cachedData));
        } else {
            console.log(`Redis cache: MISS for ${key}`);
            console.log(`Redis cache: Will store response in cache`);
            
            // If no cache, continue to next middleware
            res.sendResponse = res.json;
            res.json = (body) => {
                console.log(`Redis cache: Storing response in cache for ${key}`);
                // Store response in cache with 5-minute expiration
                client.setEx(key, 300, JSON.stringify(body)).catch(err => {
                    console.error('Redis cache store error:', err.message);
                });
                res.sendResponse(body);
            };
            next();
        }
    } catch (error) {
        console.error('Redis cache error:', error);
        next();
    }
};

module.exports = cache;