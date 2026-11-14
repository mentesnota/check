const columnAliases = {
  code: "code",
  itemno: "code",
  itemnumber: "code",
  description: "description",
  unit: "unit",
  cost: "cost",
  directcost: "cost",
  category: "category",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => String(cell).trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error("The CSV file has an unterminated quoted field.");
  if (value.length || row.length) {
    row.push(value);
    if (row.some((cell) => String(cell).trim())) rows.push(row);
  }
  return rows;
}

function cellText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeRows(matrix) {
  if (!matrix.length) throw new Error("The import file is empty.");
  const columns = new Map();
  matrix[0].forEach((header, index) => {
    const normalized = cellText(header).toLowerCase().replace(/[^a-z0-9]/g, "");
    const column = columnAliases[normalized];
    if (column && !columns.has(column)) columns.set(column, index);
  });

  for (const required of ["code", "description", "category"]) {
    if (!columns.has(required)) {
      throw new Error(`The import file needs a "${required}" column.`);
    }
  }

  const rows = [];
  for (let index = 1; index < matrix.length; index += 1) {
    const cells = matrix[index];
    if (!cells || cells.every((cell) => !cellText(cell))) continue;

    const get = (column) => columns.has(column) ? cellText(cells[columns.get(column)]) : "";
    const code = get("code");
    const description = get("description");
    const category = get("category");
    if (!code || !description || !category) {
      throw new Error(`Row ${index + 1} needs a code, description, and category.`);
    }

    const costText = get("cost").replace(/,/g, "");
    const cost = costText ? Number(costText) : null;
    if (costText && (!Number.isFinite(cost) || cost < 0)) {
      throw new Error(`Row ${index + 1} has an invalid cost.`);
    }

    rows.push({
      code,
      description,
      unit: get("unit"),
      cost,
      category,
    });
  }

  if (!rows.length) throw new Error("The import file contains no rate rows.");
  if (rows.length > 10000) throw new Error("Imports are limited to 10,000 rows.");
  return rows;
}

export async function parseRateImport(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  let matrix;
  if (extension === "csv") {
    matrix = parseCsv(await file.text());
  } else if (extension === "xlsx") {
    const { readSheet } = await import("read-excel-file/browser");
    matrix = await readSheet(file);
  } else {
    throw new Error("Choose a .csv or .xlsx file.");
  }
  return normalizeRows(matrix);
}
