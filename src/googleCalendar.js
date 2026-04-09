const https = require("node:https");
const querystring = require("node:querystring");

function defaultGoogleCalendarConfig() {
  return {
    enabled: false,
    authMethod: "",
    accessToken: "",
    refreshToken: "",
    expiresAt: null,
    calendarId: "primary",
    lastSyncedAt: null,
    lastError: null
  };
}

function httpsRequest(hostname, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method,
        headers: { "User-Agent": "Buksy/1.0", ...headers },
        timeout: 25000
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Google API request timed out"));
    });
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function refreshGoogleAccessToken(refreshToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const post = querystring.stringify({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token"
  });
  const { body } = await httpsRequest("oauth2.googleapis.com", "/token", "POST", {
    "Content-Type": "application/x-www-form-urlencoded"
  }, post);
  const json = JSON.parse(body);
  if (!json.access_token) {
    throw new Error(json.error_description || json.error || "Google token refresh failed");
  }
  return {
    accessToken: json.access_token,
    expiresIn: Number(json.expires_in) || 3600
  };
}

function overlapMinutes(rangeStart, rangeEnd, slotStart, slotEnd) {
  const s = Math.max(rangeStart.getTime(), slotStart.getTime());
  const e = Math.min(rangeEnd.getTime(), slotEnd.getTime());
  return Math.max(0, (e - s) / 60000);
}

/**
 * Sum busy minutes overlapping the local calendar day for the given calendar id.
 */
async function fetchBusyMinutesToday(accessToken, calendarId = "primary") {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const payload = JSON.stringify({
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    items: [{ id: calendarId || "primary" }]
  });

  const { statusCode, body } = await httpsRequest(
    "www.googleapis.com",
    "/calendar/v3/freeBusy",
    "POST",
    {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    payload
  );

  if (statusCode >= 400) {
    let msg = body;
    try {
      const j = JSON.parse(body);
      msg = j.error?.message || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg || `freeBusy HTTP ${statusCode}`);
  }

  const data = JSON.parse(body);
  const cal = data.calendars?.[calendarId || "primary"];
  const busy = cal?.busy || [];
  let minutes = 0;
  for (const slot of busy) {
    if (!slot.start || !slot.end) {
      continue;
    }
    minutes += overlapMinutes(dayStart, dayEnd, new Date(slot.start), new Date(slot.end));
  }

  return {
    busyMinutesToday: Math.round(minutes),
    calendarId: calendarId || "primary",
    checkedAt: new Date().toISOString()
  };
}

/**
 * Resolve a valid access token and optional persistence patch for googleCalendar integration.
 */
async function resolveGoogleAccessToken(googleCfg) {
  if (!googleCfg?.accessToken && !googleCfg?.refreshToken) {
    return { accessToken: null, persist: null };
  }

  const expiresAt = googleCfg.expiresAt ? new Date(googleCfg.expiresAt).getTime() : 0;
  const freshEnough = googleCfg.accessToken && Date.now() < expiresAt - 90_000;

  if (freshEnough) {
    return { accessToken: googleCfg.accessToken, persist: null };
  }

  if (googleCfg.refreshToken) {
    const r = await refreshGoogleAccessToken(googleCfg.refreshToken);
    const newExpires = new Date(Date.now() + r.expiresIn * 1000);
    return {
      accessToken: r.accessToken,
      persist: {
        accessToken: r.accessToken,
        expiresAt: newExpires.toISOString(),
        lastError: null
      }
    };
  }

  if (googleCfg.accessToken) {
    return { accessToken: googleCfg.accessToken, persist: null };
  }

  return { accessToken: null, persist: null };
}

/**
 * Build calendar hints for scheduling (busy time today). Updates tokens via persist if provided.
 * @param {object} googleCfg - profile.integrations.googleCalendar
 * @param {null|function(object): Promise<void>} persist - async patch merge for googleCalendar
 */
async function buildCalendarHints(googleCfg, persist) {
  if (!googleCfg?.accessToken && !googleCfg?.refreshToken) {
    return null;
  }

  try {
    const { accessToken, persist: tokenPatch } = await resolveGoogleAccessToken(googleCfg);
    if (tokenPatch && persist) {
      await persist(tokenPatch);
    }
    if (!accessToken) {
      return null;
    }
    const summary = await fetchBusyMinutesToday(accessToken, googleCfg.calendarId || "primary");
    if (persist) {
      await persist({
        lastSyncedAt: summary.checkedAt,
        lastError: null
      });
    }
    return summary;
  } catch (err) {
    if (persist) {
      await persist({ lastError: err.message || String(err), lastSyncedAt: new Date().toISOString() }).catch(
        () => {}
      );
    }
    return {
      busyMinutesToday: 0,
      error: err.message || String(err),
      checkedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  defaultGoogleCalendarConfig,
  buildCalendarHints,
  fetchBusyMinutesToday,
  refreshGoogleAccessToken
};
