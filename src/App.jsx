import React, { useEffect, useMemo, useRef, useState } from "react";
import Auth from "./Auth.jsx";
import Brand from "./Brand.jsx";
import { parseRateImport, parseResourceImport } from "./rate-import.js";
import { supabase, supabaseConfigured } from "./supabase.js";

const navigation = [
  {
    title: "WORKSPACE",
    items: [{ id: "dashboard", label: "Dashboard", icon: "grid" }],
  },
  {
    title: "ESTIMATION",
    items: [
      { id: "boq", label: "Bill of quantities", icon: "list", disabled: true },
      { id: "takeoff", label: "Take-off sheets", icon: "ruler", disabled: true },
      { id: "certificates", label: "Payment certificates", icon: "receipt", disabled: true },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [
      { id: "direct-cost", label: "Direct costs", icon: "coins" },
      { id: "indirect_cost", label: "Indirect costs", icon: "coins" },
    ],
  },
  {
    title: "RESOURCE LISTS",
    items: [
      { id: "equipment", label: "Equipment", icon: "ruler" },
      { id: "labour", label: "Labour", icon: "grid" },
      { id: "material", label: "Materials", icon: "list" },
    ],
  },
];

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    ruler: <><path d="m3 17 14-14 4 4L7 21z" /><path d="m14 6 4 4M11 9l2 2M8 12l2 2M5 15l2 2" /></>,
    receipt: <><path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2z" /><path d="M8 8h8M8 12h8M8 16h3" /></>,
    coins: <><circle cx="8" cy="8" r="5" /><path d="M13 5.5a5 5 0 1 1-4.5 8.9M8 5v6M6 7h3M6 9h3M14 13h6M14 17h6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    sliders: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function MetricCard({ label, value, note, icon, tone }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon name={icon} size={19} /></div>
      <p className="metric-label">{label}</p>
      <div className="metric-value">{value}</div>
      <p className="metric-note">{note}</p>
    </article>
  );
}

function Dashboard({ categories, pricedItems, totalItems, greeting, dataError, onOpenCosts }) {
  const largestCategories = categories.slice(0, 5);
  const maxCount = largestCategories[0]?.count || 1;

  return (
    <main className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">SATURDAY, NOVEMBER 14, 2026</p>
          <h1>Good morning, {greeting} <span className="wave">✦</span></h1>
          <p className="welcome-copy">Here’s your construction cost library at a glance.</p>
        </div>
        <button className="primary-button" onClick={onOpenCosts}>
          <Icon name="plus" size={17} /> Browse cost library
        </button>
      </div>

      <section className="metric-grid" aria-label="Cost library overview">
        <MetricCard label="Rate items" value={totalItems.toLocaleString()} note="In the current price library" icon="list" tone="mint" />
        <MetricCard label="Priced items" value={pricedItems.toLocaleString()} note="Items with a direct cost rate" icon="coins" tone="blue" />
        <MetricCard label="Work categories" value={categories.length} note="Across all construction divisions" icon="grid" tone="amber" />
        <MetricCard label="Price reference" value="2018 Q4" note="ETB · Ethiopian Birr" icon="calendar" tone="violet" />
      </section>

      <section className="dashboard-panels">
        <article className="panel category-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LIBRARY BREAKDOWN</p>
              <h2>Items by work category</h2>
            </div>
            <button className="text-button" onClick={onOpenCosts}>View all <Icon name="chevron" size={15} /></button>
          </div>
          <div className="category-list">
            {largestCategories.map((category, index) => (
              <div className="category-row" key={category.name}>
                <div className="category-meta">
                  <span className={`category-dot dot-${index % 5}`} />
                  <span>{category.name}</span>
                  <strong>{category.count.toLocaleString()}</strong>
                </div>
                <div className="bar-track">
                  <div className={`bar-fill fill-${index % 5}`} style={{ width: `${Math.max(7, (category.count / maxCount) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="panel-footnote">Showing the five largest categories in the imported rate library.</p>
        </article>

        <article className="panel reference-panel">
          <div className="reference-mark"><Icon name="coins" size={23} /></div>
          <p className="eyebrow">ACTIVE RATE REFERENCE</p>
          <h2>Construction Direct Cost</h2>
          <p className="reference-description">A national price reference imported from your 2018 fourth-quarter schedule.</p>
          <div className="reference-details">
            <div><span>Currency</span><strong>ETB</strong></div>
            <div><span>Source period</span><strong>2018 · Q4</strong></div>
            <div><span>Rates available</span><strong>{pricedItems.toLocaleString()}</strong></div>
          </div>
          <button className="secondary-button" onClick={onOpenCosts}>Open direct costs <Icon name="arrow" size={15} /></button>
        </article>
      </section>

      <section className="setup-notice">
        <div className={`notice-check ${dataError ? "notice-warning" : ""}`}>{dataError ? "!" : "✓"}</div>
        <div>
          <strong>{dataError ? "Rate library setup required" : "Your rate library is ready"}</strong>
          <p>{dataError ? "Dashboard counts and direct cost rates will appear after the Supabase table is created and seeded." : "BOQ preparation, take-off sheets, and payment certificates can be added as the next modules."}</p>
        </div>
        {!dataError && <span className="notice-badge">NEXT UP</span>}
      </section>
    </main>
  );
}

function DirectCosts({ items, dataError, onReload, onRateAdded, onRatesReplaced }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [unit, setUnit] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [operationBusy, setOperationBusy] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [operationMessage, setOperationMessage] = useState("");
  const [newItem, setNewItem] = useState({ code: "", description: "", unit: "", cost: "", category: "" });
  const importInputRef = useRef(null);

  const categories = useMemo(() => [...new Set(items.map((item) => item.category))].sort(), [items]);
  const units = useMemo(() => [...new Set(items.map((item) => item.unit).filter(Boolean))].sort(), [items]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query || `${item.code} ${item.description} ${item.category}`.toLowerCase().includes(query);
      return matchesSearch &&
        (category === "all" || item.category === category) &&
        (unit === "all" || item.unit === unit);
    });
  }, [items, search, category, unit]);
  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setUnit("all");
  };
  const formattedCost = (cost) => cost === null ? "—" : cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const operationErrorText = (error) => typeof error?.message === "string" ? error.message : "The operation failed. Please try again.";

  async function handleAddItem(event) {
    event.preventDefault();
    setOperationError("");
    setOperationMessage("");
    const cost = newItem.cost.trim() ? Number(newItem.cost) : null;
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      setOperationError("Enter a valid non-negative cost, or leave it blank.");
      return;
    }

    setOperationBusy(true);
    try {
      const { data, error } = await supabase.rpc("add_direct_cost_item", {
        p_code: newItem.code.trim(),
        p_description: newItem.description.trim(),
        p_unit: newItem.unit.trim(),
        p_cost: cost,
        p_category: newItem.category.trim(),
      });
      if (error) throw error;

      onRateAdded({
        source_row: data,
        code: newItem.code.trim(),
        description: newItem.description.trim(),
        unit: newItem.unit.trim(),
        cost,
        category: newItem.category.trim(),
      });
      setShowAddForm(false);
      setNewItem({ code: "", description: "", unit: "", cost: "", category: "" });
      setOperationMessage("Rate item added.");
    } catch (error) {
      setOperationError(operationErrorText(error));
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleImportSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setOperationError("");
    setOperationMessage("");
    setOperationBusy(true);
    try {
      const rows = await parseRateImport(file);
      setPendingImport({ fileName: file.name, rows });
    } catch (error) {
      setOperationError(operationErrorText(error));
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleReplaceImport() {
    if (!pendingImport) return;
    setOperationError("");
    setOperationBusy(true);
    try {
      const { error } = await supabase.rpc("replace_direct_cost_items", {
        p_items: pendingImport.rows,
      });
      if (error) throw error;

      onRatesReplaced(pendingImport.rows);
      setOperationMessage(`Replaced the rate library with ${pendingImport.rows.length.toLocaleString()} items.`);
      setPendingImport(null);
    } catch (error) {
      setOperationError(operationErrorText(error));
    } finally {
      setOperationBusy(false);
    }
  }

  return (
    <main className="page-content direct-cost-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">CONFIGURATION / RATE LIBRARY</p>
          <h1>Direct costs</h1>
          <p className="welcome-copy">Browse the standard direct cost rates used as the basis for your estimates.</p>
        </div>
        <div className="direct-cost-tools">
          <input
            ref={importInputRef}
            className="file-input-hidden"
            type="file"
            accept=".csv,.xlsx"
            onChange={handleImportSelection}
            aria-label="Choose a CSV or Excel rate list"
          />
          <button className="secondary-button" onClick={() => importInputRef.current?.click()} disabled={operationBusy}>Import list</button>
          <button className="primary-button" onClick={() => { setOperationError(""); setShowAddForm(true); }} disabled={operationBusy}>
            <Icon name="plus" size={16} /> Add item
          </button>
        </div>
      </div>

      {dataError && (
        <div className="rate-page-alert" role="status">
          Rates are unavailable until the Supabase table is set up. You can still add or import rates after running the setup SQL.
          <button onClick={onReload}>Retry loading</button>
        </div>
      )}
      {operationError && <p className="rate-operation-message error" role="alert">{operationError}</p>}
      {operationMessage && <p className="rate-operation-message success" role="status">{operationMessage}</p>}
      {operationBusy && !showAddForm && !pendingImport && <p className="rate-operation-message">Reading import file...</p>}

      <section className="filter-card" aria-label="Filter direct cost items">
        <label className="search-field">
          <Icon name="search" size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by item, description, or category" />
          {search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
        </label>
        <label className="select-field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="select-field unit-select">
          <span>Unit</span>
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option value="all">All units</option>
            {units.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button className="reset-button" onClick={resetFilters}><Icon name="sliders" size={16} /> Reset</button>
      </section>

      <section className="table-card">
        <div className="table-heading">
          <div>
            <h2>Rate schedule</h2>
            <p>Imported from the supplied direct cost schedule</p>
          </div>
          <div className="result-count"><strong>{filteredItems.length.toLocaleString()}</strong> of {items.length.toLocaleString()} items</div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th className="code-column">ITEM NO.</th><th>DESCRIPTION</th><th className="unit-column">UNIT</th><th className="cost-column">DIRECT COST <span>(ETB)</span></th><th className="category-column">CATEGORY</th></tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? filteredItems.map((item) => (
                <tr key={item.source_row}>
                  <td><span className="item-code">{item.code}</span></td>
                  <td className="description-cell">{item.description}</td>
                  <td><span className="unit-badge">{item.unit || "—"}</span></td>
                  <td className={`cost-cell ${item.cost === null ? "no-cost" : ""}`}>{formattedCost(item.cost)}</td>
                  <td><span className="category-label">{item.category}</span></td>
                </tr>
              )) : (
                <tr><td className="empty-state" colSpan="5"><span>⌕</span><strong>{dataError ? "Rate data unavailable" : "No matching rates"}</strong><small>{dataError ? "Use the setup steps in the warning above to connect your rate library." : "Try another search or reset your filters."}</small>{!dataError && <button onClick={resetFilters}>Reset filters</button>}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span><span className={`status-dot ${dataError ? "error" : ""}`} /> {dataError ? "Rate data unavailable" : "Rate data loaded"}</span><span>Prices shown in Ethiopian Birr (ETB)</span></div>
      </section>

      {showAddForm && (
        <div className="rate-modal-backdrop">
          <section className="rate-modal" role="dialog" aria-modal="true" aria-labelledby="add-rate-title">
            <div className="rate-modal-heading">
              <div><p className="eyebrow">DIRECT COSTS</p><h2 id="add-rate-title">Add rate item</h2></div>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => setShowAddForm(false)} disabled={operationBusy}>×</button>
            </div>
            <form className="rate-item-form" onSubmit={handleAddItem}>
              <label><span>Item code</span><input value={newItem.code} onChange={(event) => setNewItem({ ...newItem, code: event.target.value })} required /></label>
              <label className="wide-field"><span>Description</span><input value={newItem.description} onChange={(event) => setNewItem({ ...newItem, description: event.target.value })} required /></label>
              <label><span>Unit</span><input value={newItem.unit} onChange={(event) => setNewItem({ ...newItem, unit: event.target.value })} /></label>
              <label><span>Direct cost (ETB)</span><input type="number" min="0" step="0.01" value={newItem.cost} onChange={(event) => setNewItem({ ...newItem, cost: event.target.value })} /></label>
              <label className="wide-field"><span>Category</span><input value={newItem.category} onChange={(event) => setNewItem({ ...newItem, category: event.target.value })} required /></label>
              {operationError && <p className="rate-operation-message error wide-field" role="alert">{operationError}</p>}
              <div className="rate-modal-actions wide-field">
                <button className="reset-button" type="button" onClick={() => setShowAddForm(false)} disabled={operationBusy}>Cancel</button>
                <button className="primary-button" type="submit" disabled={operationBusy}>{operationBusy ? "Saving..." : "Save item"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {pendingImport && (
        <div className="rate-modal-backdrop">
          <section className="rate-modal" role="dialog" aria-modal="true" aria-labelledby="replace-rates-title">
            <div className="rate-modal-heading">
              <div><p className="eyebrow">REPLACE RATE LIBRARY</p><h2 id="replace-rates-title">Confirm import</h2></div>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => { if (!operationBusy) setPendingImport(null); }} disabled={operationBusy}>×</button>
            </div>
            <p className="import-file-name">{pendingImport.fileName}</p>
            <p className="import-warning">This file contains {pendingImport.rows.length.toLocaleString()} rows and will replace all {items.length.toLocaleString()} current rate items. This cannot be undone.</p>
            {operationError && <p className="rate-operation-message error" role="alert">{operationError}</p>}
            <div className="rate-modal-actions">
              <button className="reset-button" onClick={() => { if (!operationBusy) { setPendingImport(null); setOperationError(""); } }} disabled={operationBusy}>Cancel</button>
              <button className="primary-button" onClick={handleReplaceImport} disabled={operationBusy}>{operationBusy ? "Importing..." : `Replace with ${pendingImport.rows.length.toLocaleString()} items`}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

const resourceListConfig = {
  equipment: { title: "Equipment list", itemName: "Equipment name" },
  labour: { title: "Labour list", itemName: "Labour title" },
  material: { title: "Materials list", itemName: "Material name" },
  indirect_cost: { title: "Indirect costs", itemName: "Indirect cost name" },
};

function ResourceList({ resourceType, items, loading, dataError, onReload, onItemAdded, onItemsReplaced }) {
  const config = resourceListConfig[resourceType];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [unit, setUnit] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [operationBusy, setOperationBusy] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [operationMessage, setOperationMessage] = useState("");
  const [newItem, setNewItem] = useState({ name: "", unit: "", price: "", category: "" });
  const importInputRef = useRef(null);

  const categories = useMemo(() => [...new Set(items.map((item) => item.category))].sort(), [items]);
  const units = useMemo(() => [...new Set(items.map((item) => item.unit))].sort(), [items]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query || `${item.name} ${item.unit} ${item.category}`.toLowerCase().includes(query);
      return matchesSearch &&
        (category === "all" || item.category === category) &&
        (unit === "all" || item.unit === unit);
    });
  }, [items, search, category, unit]);
  const operationErrorText = (error) => typeof error?.message === "string" ? error.message : "The operation failed. Please try again.";
  const formattedPrice = (price) => Number(price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function handleAddItem(event) {
    event.preventDefault();
    setOperationError("");
    setOperationMessage("");
    const price = Number(newItem.price);
    if (!Number.isFinite(price) || price < 0) {
      setOperationError("Enter a valid non-negative price.");
      return;
    }

    setOperationBusy(true);
    try {
      const { data, error } = await supabase.rpc("add_resource_item", {
        p_resource_type: resourceType,
        p_name: newItem.name.trim(),
        p_unit: newItem.unit.trim(),
        p_price: price,
        p_category: newItem.category.trim(),
      });
      if (error) throw error;

      onItemAdded(resourceType, {
        source_row: data,
        name: newItem.name.trim(),
        unit: newItem.unit.trim(),
        price,
        category: newItem.category.trim(),
      });
      setShowAddForm(false);
      setNewItem({ name: "", unit: "", price: "", category: "" });
      setOperationMessage(`${config.itemName} added.`);
    } catch (error) {
      setOperationError(operationErrorText(error));
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleImportSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setOperationError("");
    setOperationMessage("");
    setOperationBusy(true);
    try {
      const rows = await parseResourceImport(file);
      setPendingImport({ fileName: file.name, rows });
    } catch (error) {
      setOperationError(operationErrorText(error));
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleReplaceImport() {
    if (!pendingImport) return;
    setOperationError("");
    setOperationBusy(true);
    try {
      const { error } = await supabase.rpc("replace_resource_items", {
        p_resource_type: resourceType,
        p_items: pendingImport.rows,
      });
      if (error) throw error;

      onItemsReplaced(resourceType, pendingImport.rows);
      setOperationMessage(`Replaced the ${config.title.toLowerCase()} with ${pendingImport.rows.length.toLocaleString()} items.`);
      setPendingImport(null);
    } catch (error) {
      setOperationError(operationErrorText(error));
    } finally {
      setOperationBusy(false);
    }
  }

  return (
    <main className="page-content direct-cost-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">RESOURCE LISTS / {resourceType.toUpperCase()}</p>
          <h1>{config.title}</h1>
          <p className="welcome-copy">Manage the {config.title.toLowerCase()} used in your estimates.</p>
        </div>
        <div className="direct-cost-tools">
          <input
            ref={importInputRef}
            className="file-input-hidden"
            type="file"
            accept=".xlsx,.csv"
            onChange={handleImportSelection}
            aria-label={`Choose an Excel or CSV ${config.title.toLowerCase()}`}
          />
          <button className="secondary-button" onClick={() => importInputRef.current?.click()} disabled={operationBusy}>Import Excel / CSV</button>
          <button className="primary-button" onClick={() => { setOperationError(""); setShowAddForm(true); }} disabled={operationBusy}>
            <Icon name="plus" size={16} /> Add item
          </button>
        </div>
      </div>

      {dataError && (
        <div className="rate-page-alert" role="status">
          This list is unavailable until the resource table is set up in Supabase. Run the latest supabase/schema.sql, then retry.
          <button onClick={onReload}>Retry loading</button>
        </div>
      )}
      {operationError && <p className="rate-operation-message error" role="alert">{operationError}</p>}
      {operationMessage && <p className="rate-operation-message success" role="status">{operationMessage}</p>}
      {operationBusy && !showAddForm && !pendingImport && <p className="rate-operation-message">Reading import file...</p>}

      <section className="filter-card" aria-label={`Filter ${config.title.toLowerCase()}`}>
        <label className="search-field">
          <Icon name="search" size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} />
          {search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
        </label>
        <label className="select-field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="select-field unit-select">
          <span>Unit</span>
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option value="all">All units</option>
            {units.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button className="reset-button" onClick={() => { setSearch(""); setCategory("all"); setUnit("all"); }}><Icon name="sliders" size={16} /> Reset</button>
      </section>

      <section className="table-card">
        <div className="table-heading">
          <div>
            <h2>{config.title}</h2>
            <p>Shared resource prices in Ethiopian Birr</p>
          </div>
          <div className="result-count"><strong>{filteredItems.length.toLocaleString()}</strong> of {items.length.toLocaleString()} items</div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>NAME</th><th className="unit-column">UNIT</th><th className="cost-column">PRICE <span>(ETB)</span></th><th className="category-column">CATEGORY</th></tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? filteredItems.map((item) => (
                <tr key={item.source_row}>
                  <td className="description-cell">{item.name}</td>
                  <td><span className="unit-badge">{item.unit}</span></td>
                  <td className="cost-cell">{formattedPrice(item.price)}</td>
                  <td><span className="category-label">{item.category}</span></td>
                </tr>
              )) : (
                <tr><td className="empty-state" colSpan="4"><span>⌕</span><strong>{dataError ? "List data unavailable" : loading ? "Loading list..." : "No items yet"}</strong><small>{dataError ? "Run the Supabase setup SQL to create the resource lists." : "Add an item or import an Excel/CSV list to get started."}</small></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span><span className={`status-dot ${dataError ? "error" : ""}`} /> {dataError ? "List data unavailable" : loading ? "Loading list" : "List data loaded"}</span><span>Prices shown in Ethiopian Birr (ETB)</span></div>
      </section>

      {showAddForm && (
        <div className="rate-modal-backdrop">
          <section className="rate-modal" role="dialog" aria-modal="true" aria-labelledby="add-resource-title">
            <div className="rate-modal-heading">
              <div><p className="eyebrow">{resourceType.toUpperCase()}</p><h2 id="add-resource-title">Add {config.itemName.toLowerCase()}</h2></div>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => setShowAddForm(false)} disabled={operationBusy}>×</button>
            </div>
            <form className="rate-item-form" onSubmit={handleAddItem}>
              <label className="wide-field"><span>{config.itemName}</span><input value={newItem.name} onChange={(event) => setNewItem({ ...newItem, name: event.target.value })} required /></label>
              <label><span>Unit</span><input value={newItem.unit} onChange={(event) => setNewItem({ ...newItem, unit: event.target.value })} required /></label>
              <label><span>Price (ETB)</span><input type="number" min="0" step="0.01" value={newItem.price} onChange={(event) => setNewItem({ ...newItem, price: event.target.value })} required /></label>
              <label className="wide-field"><span>Category</span><input value={newItem.category} onChange={(event) => setNewItem({ ...newItem, category: event.target.value })} required /></label>
              {operationError && <p className="rate-operation-message error wide-field" role="alert">{operationError}</p>}
              <div className="rate-modal-actions wide-field">
                <button className="reset-button" type="button" onClick={() => setShowAddForm(false)} disabled={operationBusy}>Cancel</button>
                <button className="primary-button" type="submit" disabled={operationBusy}>{operationBusy ? "Saving..." : "Save item"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {pendingImport && (
        <div className="rate-modal-backdrop">
          <section className="rate-modal" role="dialog" aria-modal="true" aria-labelledby="replace-resource-title">
            <div className="rate-modal-heading">
              <div><p className="eyebrow">REPLACE {resourceType.toUpperCase()} LIST</p><h2 id="replace-resource-title">Confirm import</h2></div>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => { if (!operationBusy) setPendingImport(null); }} disabled={operationBusy}>×</button>
            </div>
            <p className="import-file-name">{pendingImport.fileName}</p>
            <p className="import-warning">This file contains {pendingImport.rows.length.toLocaleString()} items and will replace all {items.length.toLocaleString()} items in the {config.title.toLowerCase()}. This cannot be undone.</p>
            {operationError && <p className="rate-operation-message error" role="alert">{operationError}</p>}
            <div className="rate-modal-actions">
              <button className="reset-button" onClick={() => { if (!operationBusy) { setPendingImport(null); setOperationError(""); } }} disabled={operationBusy}>Cancel</button>
              <button className="primary-button" onClick={handleReplaceImport} disabled={operationBusy}>{operationBusy ? "Importing..." : `Replace with ${pendingImport.rows.length.toLocaleString()} items`}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [reloadItems, setReloadItems] = useState(0);
  const [resourceItems, setResourceItems] = useState({ equipment: [], labour: [], material: [], indirect_cost: [] });
  const [resourceItemsLoading, setResourceItemsLoading] = useState(false);
  const [resourceItemsLoaded, setResourceItemsLoaded] = useState(false);
  const [resourceItemsError, setResourceItemsError] = useState("");
  const [reloadResourceItems, setReloadResourceItems] = useState(0);
  const pricedItems = items.filter((item) => item.cost !== null).length;
  const categories = useMemo(() => {
    const counts = new Map();
    for (const item of items) counts.set(item.category, (counts.get(item.category) || 0) + 1);
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionError("");
      setSessionLoading(false);
    });

    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active) setSession(data.session);
      } catch (error) {
        if (active) setSessionError(error instanceof Error ? error.message : "Unable to restore your session.");
      } finally {
        if (active) setSessionLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setItems([]);
      setItemsLoaded(false);
      return undefined;
    }

    let active = true;
    const pageSize = 1000;

    async function loadItems() {
      setItemsLoading(true);
      setItemsError("");
      try {
        const allItems = [];
        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from("direct_cost_items")
            .select("source_row, code, description, unit, cost, category")
            .order("source_row", { ascending: true })
            .range(offset, offset + pageSize - 1);
          if (error) throw error;
          allItems.push(...data);
          if (data.length < pageSize) break;
        }
        if (active) {
          setItems(allItems);
          setItemsLoaded(true);
        }
      } catch (error) {
        if (active) {
          if (error?.code === "PGRST205") {
            setItemsError("The public.direct_cost_items table is missing. Run the latest supabase/schema.sql in the SQL Editor, then use Direct Costs → Import list.");
          } else {
            setItemsError(
              error instanceof Error
                ? error.message
                : typeof error?.message === "string"
                  ? error.message
                  : "Unable to load the rate library.",
            );
          }
        }
      } finally {
        if (active) setItemsLoading(false);
      }
    }

    loadItems();
    return () => {
      active = false;
    };
  }, [session?.user?.id, reloadItems]);

  useEffect(() => {
    if (!session?.user) {
      setResourceItems({ equipment: [], labour: [], material: [], indirect_cost: [] });
      setResourceItemsLoaded(false);
      return undefined;
    }

    let active = true;
    const pageSize = 1000;

    async function loadResourceItems() {
      setResourceItemsLoading(true);
      setResourceItemsLoaded(false);
      setResourceItemsError("");
      try {
        const allItems = [];
        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from("resource_items")
            .select("resource_type, source_row, name, unit, price, category")
            .order("resource_type", { ascending: true })
            .order("source_row", { ascending: true })
            .range(offset, offset + pageSize - 1);
          if (error) throw error;
          allItems.push(...data);
          if (data.length < pageSize) break;
        }

        if (active) {
          const grouped = { equipment: [], labour: [], material: [], indirect_cost: [] };
          for (const item of allItems) {
            if (Object.hasOwn(grouped, item.resource_type)) grouped[item.resource_type].push(item);
          }
          setResourceItems(grouped);
          setResourceItemsLoaded(true);
        }
      } catch (error) {
        if (active) {
          setResourceItemsError(
            error?.code === "PGRST205"
              ? "The public.resource_items table is missing. Run the latest supabase/schema.sql in the SQL Editor."
              : error instanceof Error
                ? error.message
                : "Unable to load the resource lists.",
          );
          setResourceItemsLoaded(true);
        }
      } finally {
        if (active) setResourceItemsLoading(false);
      }
    }

    loadResourceItems();
    return () => {
      active = false;
    };
  }, [session?.user?.id, reloadResourceItems]);

  if (!supabaseConfigured) {
    return (
      <main className="auth-shell">
        <section className="auth-card setup-card">
          <a className="brand auth-brand" href="/" aria-label="Ethio-Con Tech home">
            <Brand />
          </a>
          <p className="eyebrow">SUPABASE CONFIGURATION</p>
          <h1>Connect your project</h1>
          <p className="auth-description">Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> from <code>.env.example</code> in your local <code>.env</code> and restart the dev server. For Firebase, set both as GitHub Actions secrets and redeploy.</p>
        </section>
      </main>
    );
  }

  if (sessionLoading) {
    return <main className="auth-shell"><p className="auth-loading">Checking your session...</p></main>;
  }

  if (sessionError) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">SESSION ERROR</p>
          <h1>Unable to connect</h1>
          <p className="auth-message error" role="alert">{sessionError}</p>
          <button className="primary-button auth-submit" onClick={() => window.location.reload()}>Try again</button>
        </section>
      </main>
    );
  }

  if (!session) return <Auth />;

  if (itemsLoading || (!itemsLoaded && !itemsError)) {
    return <main className="auth-shell"><p className="auth-loading">Loading your rate library...</p></main>;
  }

  const user = session.user;
  const greeting = user.email?.split("@")[0] || "there";
  const initials = (user.email || "U").slice(0, 2).toUpperCase();
  async function handleSignOut() {
    setAccountError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setAccountError(error.message);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Unable to sign out.");
    }
  }

  function handleRateAdded(item) {
    setItems((currentItems) => [...currentItems, item].sort((left, right) => left.source_row - right.source_row));
    setItemsLoaded(true);
    setItemsError("");
  }

  function handleRatesReplaced(rows) {
    setItems(rows.map((item, index) => ({ ...item, source_row: index + 1 })));
    setItemsLoaded(true);
    setItemsError("");
  }

  function handleResourceItemAdded(resourceType, item) {
    setResourceItems((current) => ({
      ...current,
      [resourceType]: [...current[resourceType], item].sort((left, right) => left.source_row - right.source_row),
    }));
    setResourceItemsLoaded(true);
    setResourceItemsError("");
  }

  function handleResourceItemsReplaced(resourceType, rows) {
    setResourceItems((current) => ({
      ...current,
      [resourceType]: rows.map((item, index) => ({ ...item, resource_type: resourceType, source_row: index + 1 })),
    }));
    setResourceItemsLoaded(true);
    setResourceItemsError("");
  }

  const activeTitle = {
    dashboard: "Dashboard",
    "direct-cost": "Direct costs",
    equipment: "Equipment",
    labour: "Labour",
    material: "Materials",
    indirect_cost: "Indirect costs",
  }[page];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage("dashboard"); }} aria-label="Ethio-Con Tech home">
          <Brand />
        </a>
        <div className="workspace-switcher">
          <div className="workspace-avatar">NC</div>
          <div className="workspace-copy"><strong>Northstar Construction</strong><span>Estimator workspace</span></div>
          <span className="workspace-chevron">⌄</span>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-heading">{group.title}</p>
              {group.items.map((item) => (
                <button
                  className={`nav-link ${page === item.id ? "active" : ""} ${item.disabled ? "disabled" : ""}`}
                  key={item.id}
                  onClick={() => !item.disabled && setPage(item.id)}
                  disabled={item.disabled}
                  title={item.disabled ? "Coming soon" : undefined}
                >
                  <Icon name={item.icon} size={18} /><span>{item.label}</span>
                  {item.disabled && <span className="soon-dot" />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon">?</span><div><strong>Need a hand?</strong><span>Visit the help center</span></div><Icon name="chevron" size={15} /></div>
          <div className="user-profile">
            <div className="user-avatar">{initials}</div>
            <div className="user-copy"><strong>{user.email}</strong><span>Signed in</span></div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{activeTitle}</strong></div>
          <div className="topbar-actions">
            <span className="environment-tag"><span /> All changes saved</span>
            <button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" size={18} /><i /></button>
            <div className="topbar-avatar" title={user.email}>{initials}</div>
            <button className="signout-button" onClick={handleSignOut}>Sign out</button>
          </div>
        </header>
        {accountError && <p className="account-error" role="alert">{accountError}</p>}
        {itemsError && (
          <div className="rate-load-alert" role="alert">
            <p>{itemsError}</p>
            <div className="rate-load-actions">
              <a href="https://supabase.com/dashboard/project/igfhfdlzldmpknhsagka/sql/new" target="_blank" rel="noreferrer">Open Supabase SQL Editor</a>
              <button onClick={() => setReloadItems((count) => count + 1)}>Retry</button>
            </div>
          </div>
        )}
        {page === "dashboard" ? (
          <Dashboard categories={categories} pricedItems={pricedItems} totalItems={items.length} greeting={greeting} dataError={itemsError} onOpenCosts={() => setPage("direct-cost")} />
        ) : page === "direct-cost" ? (
          <DirectCosts
            items={items}
            dataError={itemsError}
            onReload={() => setReloadItems((count) => count + 1)}
            onRateAdded={handleRateAdded}
            onRatesReplaced={handleRatesReplaced}
          />
        ) : (
          <ResourceList
            resourceType={page}
            items={resourceItems[page]}
            loading={resourceItemsLoading || !resourceItemsLoaded}
            dataError={resourceItemsError}
            onReload={() => setReloadResourceItems((count) => count + 1)}
            onItemAdded={handleResourceItemAdded}
            onItemsReplaced={handleResourceItemsReplaced}
          />
        )}
        <footer className="app-footer"><span>Ethio-Con Tech <span>·</span> Construction estimating workspace</span><span>Rate reference: 2018 Q4 · ETB</span></footer>
      </div>
    </div>
  );
}
