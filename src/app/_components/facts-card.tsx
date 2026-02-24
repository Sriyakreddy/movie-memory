"use client";

import type { FactDto } from "@/types/api";

type FactsCardProps = {
  favoriteMovie: string;
  facts: FactDto[];
  currentFact: FactDto | null;
  loading: boolean;
  error: string | null;
  fetchMeta: { cached: boolean; atMs: number } | null;
  onGetFact: () => void;
  onGenerateNewFact: () => void;
};

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${timestampFormatter.format(date)} UTC`;
}

export default function FactsCard({
  favoriteMovie,
  currentFact,
  loading,
  error,
  fetchMeta,
  onGetFact,
  onGenerateNewFact,
}: FactsCardProps) {
  return (
    <div id="facts" className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <h2 className="text-xl font-bold">Movie Facts</h2>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onGetFact}
          disabled={loading}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Get Fact"}
        </button>
        <button
          onClick={onGenerateNewFact}
          disabled={loading}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
        >
          Force New Fact
        </button>
      </div>

      {fetchMeta && (
        <p className="mt-3 text-xs text-white/60">
          Last request: {fetchMeta.cached ? "Cached" : "Fresh"} at {new Date(fetchMeta.atMs).toLocaleTimeString()}
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {!favoriteMovie && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
          Set your favorite movie first.
        </div>
      )}

      {favoriteMovie && currentFact ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-xs text-white/55">Latest for {favoriteMovie}</div>
          <div className="mt-1 text-sm text-white">{currentFact.text}</div>
          <div className="mt-2 text-xs text-white/45">{formatTimestamp(currentFact.createdAt)}</div>
        </div>
      ) : (
        favoriteMovie && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
            No fact yet. Click &quot;Get Fact&quot;.
          </div>
        )
      )}
    </div>
  );
}
