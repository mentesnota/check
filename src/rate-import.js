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

const resourceColumnAliases = {
  name: "name",
  title: "name",
  itemname: "name",
  equipmentname: "name",
  labourtitle: "name",
  labortitle: "name",
  labourname: "name",
  laborname: "name",
  materialname: "name",
  unit: "unit",
  price: "price",
  priceetb: "price",
  unitprice: "price",
  unitpriceetb: "price",
  rate: "price",
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

function normalizeResourceRows(matrix) {
  if (!matrix.length) throw new Error("The import file is empty.");
  const columns = new Map();
  matrix[0].forEach((header, index) => {
    const normalized = cellText(header).toLowerCase().replace(/[^a-z0-9]/g, "");
    const column = resourceColumnAliases[normalized];
    if (column && !columns.has(column)) columns.set(column, index);
  });

  for (const required of ["name", "unit", "price", "category"]) {
    if (!columns.has(required)) {
      throw new Error(`The import file needs a "${required}" column.`);
    }
  }

  const rows = [];
  for (let index = 1; index < matrix.length; index += 1) {
    const cells = matrix[index];
    if (!cells || cells.every((cell) => !cellText(cell))) continue;

    const get = (column) => cellText(cells[columns.get(column)]);
    const name = get("name");
    const unit = get("unit");
    const priceText = get("price").replace(/,/g, "");
    const category = get("category");
    const price = priceText ? Number(priceText) : Number.NaN;
    if (!name || !unit || !category || !priceText) {
      throw new Error(`Row ${index + 1} needs a name, unit, price, and category.`);
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Row ${index + 1} has an invalid price.`);
    }

    rows.push({ name, unit, price, category });
  }

  if (!rows.length) throw new Error("The import file contains no items.");
  if (rows.length > 10000) throw new Error("Imports are limited to 10,000 rows.");
  return rows;
}

async function readImportMatrix(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (extension === "csv") {
    return parseCsv(await file.text());
  }
  if (extension === "xlsx") {
    const { readSheet } = await import("read-excel-file/browser");
    return readSheet(file);
  }
  throw new Error("Choose a .csv or .xlsx file.");
}

export async function parseRateImport(file) {
  return normalizeRows(await readImportMatrix(file));
}

export async function parseResourceImport(file) {
  return normalizeResourceRows(await readImportMatrix(file));
}
