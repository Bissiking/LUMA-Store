import { Activity, CheckCircle2, XCircle, Clock, Database } from "lucide-react";
import { query } from "@/lib/db";
import { config } from "@/lib/config";

export const metadata = { title: "État du service" };

interface ArgosPoint {
  sampledAt: string;
  latencyMs: string | null;
  okPct: number | null;
  samples: number;
}

interface ArgosResponse {
  range: string;
  points: ArgosPoint[];
}

async function checkDatabase(): Promise<{ status: "ok" | "error"; latencyMs: number }> {
  const start = Date.now();
  try {
    await query("SELECT 1");
    return { status: "ok", latencyMs: Date.now() - start };
  } catch {
    return { status: "error", latencyMs: Date.now() - start };
  }
}

async function fetchArgosMetrics(): Promise<ArgosPoint[] | null> {
  if (!config.argosConfigured || !config.ARGOS_BASE_URL || !config.ARGOS_TOKEN) return null;
  try {
    const url = `${config.ARGOS_BASE_URL}/api/v1/public/url-checks/${config.ARGOS_TOKEN}/metrics?range=7d`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data: ArgosResponse = await res.json();
    return data.points;
  } catch {
    return null;
  }
}

function formatLatency(ms: string | null): string {
  if (!ms) return "—";
  const num = parseFloat(ms);
  if (num < 1000) return `${Math.round(num)} ms`;
  return `${(num / 1000).toFixed(1)} s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function formatHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getUptimeColor(okPct: number | null): string {
  if (okPct === null) return "var(--surface-subtle)";
  if (okPct >= 99) return "var(--success)";
  if (okPct >= 90) return "var(--warning)";
  return "var(--danger)";
}

function getUptimeLabel(okPct: number | null): string {
  if (okPct === null) return "Aucune donnée";
  if (okPct >= 99) return "Opérationnel";
  if (okPct >= 90) return "Dégradé";
  return "Incident";
}

export default async function HealthPage() {
  const [dbHealth, argosPoints] = await Promise.all([checkDatabase(), fetchArgosMetrics()]);
  const recentPoints = argosPoints?.filter((p) => p.samples > 0) ?? [];
  const latestPoint = recentPoints[recentPoints.length - 1] ?? null;
  const overallStatus = dbHealth.status === "ok" && (latestPoint === null || (latestPoint.okPct !== null && latestPoint.okPct >= 90)) ? "ok" : "degraded";

  return (
    <main className="page-shell"><div className="container">
      <section className="health-hero">
        <div className={`health-status-badge ${overallStatus === "ok" ? "health-status-ok" : "health-status-degraded"}`}>
          {overallStatus === "ok" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          {overallStatus === "ok" ? "Tous les systèmes opérationnels" : "Système dégradé"}
        </div>
        <h1>État du service</h1>
        <p>Suivi en temps réel de la disponibilité et des performances de LUMA Store.</p>
      </section>

      <div className="health-grid">
        <section className="health-card">
          <div className="health-card-header">
            <Database size={18} />
            <h2>Base de données</h2>
          </div>
          <div className="health-card-status">
            {dbHealth.status === "ok" ? <CheckCircle2 size={16} className="health-icon-ok" /> : <XCircle size={16} className="health-icon-error" />}
            <span>{dbHealth.status === "ok" ? "Connectée" : "Indisponible"}</span>
            <small>{dbHealth.latencyMs} ms</small>
          </div>
        </section>

        <section className="health-card">
          <div className="health-card-header">
            <Activity size={18} />
            <h2>Monitor externe</h2>
          </div>
          <div className="health-card-status">
            {latestPoint ? (
              <>
                {latestPoint.okPct !== null && latestPoint.okPct >= 90 ? <CheckCircle2 size={16} className="health-icon-ok" /> : <XCircle size={16} className="health-icon-error" />}
                <span>{getUptimeLabel(latestPoint.okPct)}</span>
                <small>{latestPoint.okPct !== null ? `${latestPoint.okPct.toFixed(1)}% OK` : "—"}</small>
              </>
            ) : (
              <>
                <Clock size={16} className="health-icon-muted" />
                <span>Non configuré</span>
                <small>Argos non disponible</small>
              </>
            )}
          </div>
        </section>
      </div>

      {recentPoints.length > 0 && (
        <section className="health-timeline-section">
          <h2>Disponibilité — 7 derniers jours</h2>
          <div className="health-timeline" role="img" aria-label="Timeline de disponibilité">
            {recentPoints.map((point, i) => (
              <div
                key={point.sampledAt}
                className="health-timeline-cell"
                style={{ backgroundColor: getUptimeColor(point.okPct) }}
                title={`${formatDate(point.sampledAt)} ${formatHour(point.sampledAt)} — ${getUptimeLabel(point.okPct)} (${point.okPct !== null ? `${point.okPct.toFixed(1)}%` : "—"}) — Latence: ${formatLatency(point.latencyMs)} — ${point.samples} échantillons`}
              />
            ))}
          </div>
          <div className="health-timeline-legend">
            <span><span className="health-legend-dot" style={{ backgroundColor: "var(--success)" }} /> Opérationnel</span>
            <span><span className="health-legend-dot" style={{ backgroundColor: "var(--warning)" }} /> Dégradé</span>
            <span><span className="health-legend-dot" style={{ backgroundColor: "var(--danger)" }} /> Incident</span>
            <span><span className="health-legend-dot" style={{ backgroundColor: "var(--surface-subtle)" }} /> Aucune donnée</span>
          </div>
        </section>
      )}

      {recentPoints.length > 0 && (
        <section className="health-details-section">
          <h2>Dernières mesures</h2>
          <div className="health-table-wrap">
            <table className="health-table">
              <thead>
                <tr>
                  <th>Horodatage</th>
                  <th>Statut</th>
                  <th>Latence</th>
                  <th>Échantillons</th>
                </tr>
              </thead>
              <tbody>
                {recentPoints.slice(-24).reverse().map((point) => (
                  <tr key={point.sampledAt}>
                    <td>{formatDate(point.sampledAt)} {formatHour(point.sampledAt)}</td>
                    <td><span className="health-status-pill" style={{ color: getUptimeColor(point.okPct), backgroundColor: point.okPct !== null ? `${getUptimeColor(point.okPct)}15` : "var(--surface-subtle)" }}>{getUptimeLabel(point.okPct)}</span></td>
                    <td>{formatLatency(point.latencyMs)}</td>
                    <td>{point.samples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div></main>
  );
}
