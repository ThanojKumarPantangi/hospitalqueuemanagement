export const getLocationFromIp = async (ip) => {
  try {
    if (!ip) return null;
    console.log("ip",ip)
    if (ip === "::1" || ip === "127.0.0.1") return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); 

    const res = await fetch(`https://ipwho.is/${ip}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.success) return null;

    return {
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
      timezone: data.timezone?.id || null,
    };
  } catch(err) {
    console.log("Geo API error:", err);
    return null;
  }
};