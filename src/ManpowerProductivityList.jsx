import React, { useMemo, useRef, useState } from "react";
import { parseManpowerProductivityImport } from "./rate-import.js";
import { supabase } from "./supabase.js";

const emptyItem = {
  title: "",
  activity_type: "",
  unit: "",
  normal: "",
  renovation: "",
  category: "",
};

function errorText(error) {
  return typeof error?.message === "string" ? error.message : "The operation failed. Please try again.";
}

export default function ManpowerProductivityList({
  items,
  loading,
  dataError,
  onReload,
  onItemAdded,
  onItemsReplaced,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState(emptyItem);
  const [pendingImport, setPendingImport] = useState(null);
  const [operationBusy, setOperationBusy] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [operationMessage, setOperationMessage] = useState("");
  const importInputRef = useRef(null);
  const categories = useMemo(() => [...new Set(items.map((item) => item.category))].sort(), [items]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query ||
        `${item.title} ${item.activity_type} ${item.unit} ${item.category}`.toLowerCase().includes(query);
      return matchesSearch && (category === "all" || item.category === category);
    });
  }, [items, search, category]);

  async function handleImportSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setOperationError("");
    setOperationMessage("");
    setOperationBusy(true);
    try {
      const rows = await parseManpowerProductivityImport(file);
      setPendingImport({ fileName: file.name, rows });
    } catch (error) {
      setOperationError(errorText(error));
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleReplaceImport() {
    if (!pendingImport) return;
    setOperationError("");
    setOperationBusy(true);
    try {
      const { error } = await supabase.rpc("replace_manpower_productivity_items", {
        p_items: pendingImport.rows,
      });
      if (error) throw error;

      onItemsReplaced(pendingImport.rows);
      setOperationMessage(`Replaced the manpower productivity list with ${pendingImport.rows.length.toLocaleString()} items.`);
      setPendingImport(null);
    } catch (error) {
      setOperationError(errorText(error));
    } finally {
      setOperationBusy(false);
    }
  }

  async function handleAddItem(event) {
    event.preventDefault();
    setOperationError("");
    setOperationMessage("");
    const normal = Number(newItem.normal);
    const renovation = Number(newItem.renovation);
    if (!Number.isFinite(normal) || normal < 0 || !Number.isFinite(renovation) || renovation < 0) {
      setOperationError("Enter valid non-negative normal and renovation values.");
      return;
    }

    setOperationBusy(true);
    try {
      const item = {
        title: newItem.title.trim(),
        activity_type: newItem.activity_type.trim(),
        unit: newItem.unit.trim(),
        normal,
        renovation,
        category: newItem.category.trim(),
      };
      const { data, error } = await supabase.rpc("add_manpower_productivity_item", {
        p_title: item.title,
        p_activity_type: item.activity_type,
        p_unit: item.unit,
        p_normal: item.normal,
        p_renovation: item.renovation,
        p_category: item.category,
      });
      if (error) throw error;

      onItemAdded({ ...item, source_row: data });
      setNewItem(emptyItem);
      setShowAddForm(false);
      setOperationMessage("Manpower productivity item added.");
    } catch (error) {
      setOperationError(errorText(error));
    } finally {
      setOperationBusy(false);
    }
  }

  const setField = (field, value) => setNewItem((current) => ({ ...current, [field]: value }));

  return (
    <main className="page-content direct-cost-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">RESOURCE LISTS / MANPOWER PRODUCTIVITY</p>
          <h1>Manpower productivity list</h1>
          <p className="welcome-copy">Manage normal and renovation productivity rates by activity.</p>
        </div>
        <div className="direct-cost-tools">
          <input
            ref={importInputRef}
            className="file-input-hidden"
            type="file"
            accept=".xlsx,.csv"
            onChange={handleImportSelection}
            aria-label="Choose a manpower productivity Excel or CSV file"
          />
          <button className="secondary-button" onClick={() => importInputRef.current?.click()} disabled={operationBusy}>
            Import Excel / CSV
          </button>
          <button className="primary-button" onClick={() => { setOperationError(""); setShowAddForm(true); }} disabled={operationBusy}>
            Add item
          </button>
        </div>
      </div>

      {dataError && (
        <div className="rate-page-alert" role="status">
          This list is unavailable until the manpower productivity table is set up in Supabase. Run the latest supabase/schema.sql, then retry.
          <button onClick={onReload}>Retry loading</button>
        </div>
      )}
      {operationError && <p className="rate-operation-message error" role="alert">{operationError}</p>}
      {operationMessage && <p className="rate-operation-message success" role="status">{operationMessage}</p>}
      {operationBusy && !showAddForm && !pendingImport && <p className="rate-operation-message">Processing...</p>}

      <section className="filter-card" aria-label="Filter manpower productivity">
        <label className="search-field">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, activity, or category" />
          {search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
        </label>
        <label className="select-field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button className="reset-button" onClick={() => { setSearch(""); setCategory("all"); }}>Reset</button>
      </section>

      <section className="table-card">
        <div className="table-heading">
          <div><h2>Manpower productivity</h2><p>Productivity rates by activity, unit, and work type</p></div>
          <div className="result-count"><strong>{filteredItems.length.toLocaleString()}</strong> of {items.length.toLocaleString()} items</div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>TITLE</th><th>TYPE OF ACTIVITY</th><th className="unit-column">UNIT</th><th>NORMAL</th><th>RENOVATION</th><th className="category-column">CATEGORY</th></tr>
            </thead>
            <tbody>
              {filteredItems.length ? filteredItems.map((item) => (
                <tr key={item.source_row}>
                  <td className="description-cell">{item.title}</td>
                  <td>{item.activity_type}</td>
                  <td><span className="unit-badge">{item.unit}</span></td>
                  <td className="cost-cell">{Number(item.normal).toLocaleString("en-US")}</td>
                  <td className="cost-cell">{Number(item.renovation).toLocaleString("en-US")}</td>
                  <td><span className="category-label">{item.category}</span></td>
                </tr>
              )) : (
                <tr><td className="empty-state" colSpan="6"><strong>{dataError ? "List data unavailable" : loading ? "Loading list..." : "No items yet"}</strong><small>{dataError ? "Run the Supabase setup SQL to create the manpower productivity list." : "Add an item or import an Excel/CSV list to get started."}</small></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span><span className={`status-dot ${dataError ? "error" : ""}`} /> {dataError ? "List data unavailable" : loading ? "Loading list" : "List data loaded"}</span><span>Normal and renovation productivity rates</span></div>
      </section>

      {showAddForm && (
        <div className="rate-modal-backdrop">
          <section className="rate-modal" role="dialog" aria-modal="true" aria-labelledby="add-manpower-title">
            <div className="rate-modal-heading">
              <div><p className="eyebrow">MANPOWER PRODUCTIVITY</p><h2 id="add-manpower-title">Add productivity item</h2></div>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => setShowAddForm(false)} disabled={operationBusy}>×</button>
            </div>
            <form className="rate-item-form" onSubmit={handleAddItem}>
              <label className="wide-field"><span>Title</span><input value={newItem.title} onChange={(event) => setField("title", event.target.value)} required /></label>
              <label className="wide-field"><span>Type of activity</span><input value={newItem.activity_type} onChange={(event) => setField("activity_type", event.target.value)} required /></label>
              <label><span>Unit</span><input value={newItem.unit} onChange={(event) => setField("unit", event.target.value)} required /></label>
              <label><span>Normal</span><input type="number" min="0" step="0.0001" value={newItem.normal} onChange={(event) => setField("normal", event.target.value)} required /></label>
              <label><span>Renovation</span><input type="number" min="0" step="0.0001" value={newItem.renovation} onChange={(event) => setField("renovation", event.target.value)} required /></label>
              <label><span>Category</span><input value={newItem.category} onChange={(event) => setField("category", event.target.value)} required /></label>
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
          <section className="rate-modal" role="dialog" aria-modal="true" aria-labelledby="replace-manpower-title">
            <div className="rate-modal-heading">
              <div><p className="eyebrow">REPLACE MANPOWER PRODUCTIVITY LIST</p><h2 id="replace-manpower-title">Confirm import</h2></div>
              <button className="modal-close" type="button" aria-label="Close" onClick={() => { if (!operationBusy) setPendingImport(null); }} disabled={operationBusy}>×</button>
            </div>
            <p className="import-file-name">{pendingImport.fileName}</p>
            <p className="import-warning">This file contains {pendingImport.rows.length.toLocaleString()} items and will replace all {items.length.toLocaleString()} items in the manpower productivity list. This cannot be undone.</p>
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
