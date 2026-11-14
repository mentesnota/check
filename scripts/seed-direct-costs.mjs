import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing the rate data.");
}

const sourceUrl = new URL("../src/direct-cost-data.json", import.meta.url);
const sourceRows = JSON.parse(await readFile(sourceUrl, "utf8"));
const rows = sourceRows.map((row, index) => ({
  source_row: index + 1,
  code: row.code,
  description: row.description,
  unit: row.unit ?? "",
  cost: row.cost,
  category: row.category,
}));

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const batchSize = 500;

for (let offset = 0; offset < rows.length; offset += batchSize) {
  const batch = rows.slice(offset, offset + batchSize);
  const { error } = await supabase
    .from("direct_cost_items")
    .upsert(batch, { onConflict: "source_row" });

  if (error) {
    throw new Error(`Failed to import rows ${offset + 1}-${offset + batch.length}: ${error.message}`);
  }
}

const { error: cleanupError } = await supabase
  .from("direct_cost_items")
  .delete()
  .gt("source_row", rows.length);

if (cleanupError) {
  throw new Error(`Imported rates, but could not remove old trailing rows: ${cleanupError.message}`);
}

console.log(`Imported ${rows.length} direct cost items.`);
