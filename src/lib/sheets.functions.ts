import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

function creds() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SHEETS_API_KEY"];
  const spreadsheetId = process.env["WEACTIVE9_SPREADSHEET_ID"];
  if (!lovableKey || !connectionKey || !spreadsheetId) return null;
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
  .inputValidator((data: { range: string }) => data)
  .handler(async ({ data }) => {
    const c = creds();
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
  .inputValidator((data: { range: string; row: (string | number)[] }) => data)
  .handler(async ({ data }) => {
    const c = creds();
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
