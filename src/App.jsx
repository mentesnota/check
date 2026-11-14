import React, { useEffect, useMemo, useState } from "react";
import Auth from "./Auth.jsx";
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
    items: [{ id: "direct-cost", label: "Direct costs", icon: "coins" }],
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

function Dashboard({ categories, pricedItems, totalItems, greeting, onOpenCosts }) {
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
        <div className="notice-check">✓</div>
        <div>
          <strong>Your rate library is ready</strong>
          <p>BOQ preparation, take-off sheets, and payment certificates can be added as the next modules.</p>
        </div>
        <span className="notice-badge">NEXT UP</span>
      </section>
    </main>
  );
}

function DirectCosts({ items }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [unit, setUnit] = useState("all");

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

  return (
    <main className="page-content direct-cost-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">CONFIGURATION / RATE LIBRARY</p>
          <h1>Direct costs</h1>
          <p className="welcome-copy">Browse the standard direct cost rates used as the basis for your estimates.</p>
        </div>
        <div className="reference-chip"><span className="status-dot" /> 2018 Q4 <span className="chip-divider" /> ETB</div>
      </div>

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
                <tr key={`${item.code}-${item.description}`}>
                  <td><span className="item-code">{item.code}</span></td>
                  <td className="description-cell">{item.description}</td>
                  <td><span className="unit-badge">{item.unit || "—"}</span></td>
                  <td className={`cost-cell ${item.cost === null ? "no-cost" : ""}`}>{formattedCost(item.cost)}</td>
                  <td><span className="category-label">{item.category}</span></td>
                </tr>
              )) : (
                <tr><td className="empty-state" colSpan="5"><span>⌕</span><strong>No matching rates</strong><small>Try another search or reset your filters.</small><button onClick={resetFilters}>Reset filters</button></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span><span className="status-dot" /> Rate data loaded</span><span>Prices shown in Ethiopian Birr (ETB)</span></div>
      </section>
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
      setItemsLoaded(false);
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
        if (active) setItemsError(error instanceof Error ? error.message : "Unable to load the rate library.");
      } finally {
        if (active) setItemsLoading(false);
      }
    }

    loadItems();
    return () => {
      active = false;
    };
  }, [session?.user?.id, reloadItems]);

  if (!supabaseConfigured) {
    return (
      <main className="auth-shell">
        <section className="auth-card setup-card">
          <a className="brand auth-brand" href="/" aria-label="Buildwise home">
            <span className="brand-icon"><span /><span /><span /><span /></span>
            <span className="brand-name">buildwise<span>.</span></span>
          </a>
          <p className="eyebrow">SUPABASE CONFIGURATION</p>
          <h1>Connect your project</h1>
          <p className="auth-description">Add your Supabase project URL and anon key to a local <code>.env</code> file using the values in <code>.env.example</code>, then restart the development server.</p>
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

  if (itemsError) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">RATE LIBRARY ERROR</p>
          <h1>Unable to load rates</h1>
          <p className="auth-message error" role="alert">{itemsError}</p>
          <button className="primary-button auth-submit" onClick={() => setReloadItems((count) => count + 1)}>Try again</button>
        </section>
      </main>
    );
  }

  if (itemsLoading || !itemsLoaded) {
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

  const activeTitle = page === "dashboard" ? "Dashboard" : "Direct costs";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage("dashboard"); }}>
          <span className="brand-icon"><span /><span /><span /><span /></span>
          <span className="brand-name">buildwise<span>.</span></span>
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
        {page === "dashboard"
          ? <Dashboard categories={categories} pricedItems={pricedItems} totalItems={items.length} greeting={greeting} onOpenCosts={() => setPage("direct-cost")} />
          : <DirectCosts items={items} />}
        <footer className="app-footer"><span>Buildwise <span>·</span> Construction estimating workspace</span><span>Rate reference: 2018 Q4 · ETB</span></footer>
      </div>
    </div>
  );
}
