import {UAParser} from "ua-parser-js";

export function getDevice(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const browser = result.browser.name || "Unknown Browser";
    const os = result.os.name || "Unknown OS";

    let deviceType = result.device.type;

    // Normalize device type
    if (!deviceType) deviceType = "Desktop";
    else if (deviceType === "mobile") deviceType = "Mobile";
    else if (deviceType === "tablet") deviceType = "Tablet";
    else deviceType = "Desktop";

    return {
        browser,
        os,
        deviceType,
        fullName: `${browser} on ${os} • ${deviceType}`,
    };
}