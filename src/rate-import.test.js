import assert from "node:assert/strict";
import test from "node:test";
import { parseResourceImport } from "./rate-import.js";

function csvFile(text) {
  return {
    name: "resources.csv",
    text: async () => text,
  };
}

test("parses resource lists using list-specific name headers", async () => {
  const rows = await parseResourceImport(csvFile(
    "Equipment Name,Unit,Price (ETB),Category\nConcrete mixer,day,3200,Equipment",
  ));

  assert.deepEqual(rows, [{
    name: "Concrete mixer",
    unit: "day",
    price: 3200,
    category: "Equipment",
  }]);
});

test("rejects resource rows with negative prices", async () => {
  await assert.rejects(
    parseResourceImport(csvFile("Name,Unit,Price,Category\nCement,bag,-10,Materials")),
    /invalid price/i,
  );
});
