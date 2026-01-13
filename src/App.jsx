import { useEffect, useMemo, useState } from "react";

export default function App() {
  const [data, setData] = useState({ outcomes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repoFilter, setRepoFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("http://localhost:3000/api/fetch-contributions", {
          headers: { Accept: "application/json" },
        });

        let json = null;
        try { json = await res.json(); } catch { json = null; }

        const outcomes = json && Array.isArray(json.outcomes) ? json.outcomes : [];

        if (!cancelled) {
          setData({ outcomes });
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("Backend unreachable", err);
        setError("Backend unavailable — showing empty state");
        setData({ outcomes: [] });
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const outcomes = Array.isArray(data.outcomes) ? data.outcomes : [];
  const repos = useMemo(() => ["all", ...Array.from(new Set(outcomes.map(o => o?.repo).filter(Boolean)))], [outcomes]);
  const users = useMemo(() => ["all", ...Array.from(new Set(outcomes.map(o => o?.user).filter(Boolean)))], [outcomes]);

  const filtered = useMemo(() => outcomes.filter(o => {
    if (!o) return false;
    if (repoFilter !== "all" && o.repo !== repoFilter) return false;
    if (userFilter !== "all" && o.user !== userFilter) return false;
    return true;
  }), [outcomes, repoFilter, userFilter]);

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;

  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Human Reputation Ledger</h1>
      <p>Live GitHub contribution intelligence</p>
      {error && <div style={{ color: "darkred", marginBottom: 20 }}>{error}</div>}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <select value={repoFilter} onChange={e => setRepoFilter(e.target.value)}>
          {repos.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={userFilter} onChange={e => setUserFilter(e.target.value)}>
          {users.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr><th>User</th><th>Repo</th><th>Message</th><th>Date</th></tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="4" style={{ textAlign: "center" }}>No contributions available.</td></tr>
          ) : (
            filtered.map((o, i) => (
              <tr key={i}>
                <td>{o.user || "unknown"}</td>
                <td>{o.repo || "unknown"}</td>
                <td>{o.message || ""}</td>
                <td>{o.date ? new Date(o.date).toLocaleString() : ""}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
