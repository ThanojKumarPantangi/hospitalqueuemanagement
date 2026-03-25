export const getLocationFromIp = async (ip, redis) => {
  try {
    if (!ip) return null;

    // Skip private IPs
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168") ||
      ip.startsWith("10.")
    ) {
      return null;
    }

    const key = `ip:${ip}`;

    //  1. Check Redis cache
    const cached = await redis.get(key);
    if (cached) {
      return cached;
    }

    // 2. Call API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(
      `https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (res.status === 429) {
      console.log("Rate limit hit");
      return null;
    }

    if (!res.ok) return null;

    const data = await res.json();

    const location = {
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
      timezone: data.timezone || null,
    };

    // 3. Store in Redis with TTL 
    await redis.set(key, location, {
      ex: 60 * 60, // 1 hour
    });

    return location;
  } catch (err) {
    console.log("Geo API error:", err.name);
    return null;
  }
};