import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

function creds(overrideSpreadsheetId?: string) {
  const spreadsheetId = overrideSpreadsheetId || process.env["WEACTIVE9_SPREADSHEET_ID"];
  if (!spreadsheetId) return null;
  const lovableKey = (process.env["LOVABLE_API_KEY"] ?? "").trim();
  const connectionKey = (process.env["GOOGLE_SHEETS_API_KEY"] ?? "").trim();
  // Never send `Bearer` with an empty/whitespace token — the gateway rejects it
  // with a 400 "Malformed Authorization header".
  if (!lovableKey || !connectionKey) {
    throw new Error(
      "Google Sheets connection is not linked yet, so no access token is available. Link the Google Sheets connector in Lovable, then retry Sync sheet.",
    );
  }
  return { lovableKey, connectionKey, spreadsheetId };
}

function headers(c: NonNullable<ReturnType<typeof creds>>) {
  return {
    Authorization: `Bearer ${c.lovableKey}`,
    "X-Connection-Api-Key": c.connectionKey,
    "Content-Type": "application/json",
  };
}



/** Read a tab's values. Returns configured:false when Sheets isn't linked yet. */
export const readSheetRange = createServerFn({ method: "GET" })
  .inputValidator((data: { range: string; spreadsheetId?: string }) => data)
  .handler(async ({ data }) => {
    const c = creds(data.spreadsheetId);
    if (!c) return { configured: false as const, values: [] as string[][] };
    const res = await fetch(
      `${GATEWAY}/spreadsheets/${c.spreadsheetId}/values/${data.range}`,
      { headers: headers(c) },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google Sheets read failed [${res.status}]: ${body}`);
    }
    const json = (await res.json()) as { values?: string[][] };
    return { configured: true as const, values: json.values ?? [] };
  });

/** Append one row to a tab. */
export const appendSheetRow = createServerFn({ method: "POST" })
  .inputValidator((data: { range: string; row: (string | number)[]; spreadsheetId?: string }) => data)
  .handler(async ({ data }) => {
    const c = creds(data.spreadsheetId);
    if (!c) return { configured: false as const };
    const res = await fetch(
      `${GATEWAY}/spreadsheets/${c.spreadsheetId}/values/${data.range}:append?valueInputOption=USER_ENTERED`,
      { method: "POST", headers: headers(c), body: JSON.stringify({ values: [data.row] }) },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google Sheets append failed [${res.status}]: ${body}`);
    }
    return { configured: true as const };
  });
