import assert from "node:assert/strict";
import test from "node:test";
import { parseManpowerProductivityImport, parseResourceImport } from "./rate-import.js";

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

test("parses indirect costs with name, unit, price, and category columns", async () => {
  const rows = await parseResourceImport(csvFile(
    "Indirect Cost Name,Unit,Price,Category\nSite supervision,month,18000,Project overhead",
  ));

  assert.deepEqual(rows, [{
    name: "Site supervision",
    unit: "month",
    price: 18000,
    category: "Project overhead",
  }]);
});

test("rejects resource rows with negative prices", async () => {
  await assert.rejects(
    parseResourceImport(csvFile("Name,Unit,Price,Category\nCement,bag,-10,Materials")),
    /invalid price/i,
  );
});

test("parses manpower productivity columns", async () => {
  const rows = await parseManpowerProductivityImport(csvFile(
    "Title,Type of Activity,Unit,Normal,Renovation,Category\nMasonry wall,Block work,m2,8.5,6,Finishing",
  ));

  assert.deepEqual(rows, [{
    title: "Masonry wall",
    activity_type: "Block work",
    unit: "m2",
    normal: 8.5,
    renovation: 6,
    category: "Finishing",
  }]);
});

test("rejects manpower productivity rows with negative productivity", async () => {
  await assert.rejects(
    parseManpowerProductivityImport(csvFile(
      "Title,Type of Activity,Unit,Normal,Renovation,Category\nMasonry wall,Block work,m2,-1,6,Finishing",
    )),
    /invalid normal or renovation value/i,
  );
});
