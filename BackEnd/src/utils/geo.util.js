export const getLocationFromIp = async (ip) => {
  try {
    if (!ip) return null;
    if (ip === "::1" || ip === "127.0.0.1") return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://ipinfo.io/${ip}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    
    return {
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
      timezone: data.timezone || null,
    };
  } catch (err) {
    console.log("Geo API error:", err);
    return null;
  }
};