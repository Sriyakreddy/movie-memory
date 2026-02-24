"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FavoriteCard from "@/app/_components/favorite-card";
import FactsCard from "@/app/_components/facts-card";
import { apiClient, ApiClientError } from "@/lib/api";
import type { FactDto } from "@/types/api";

type DashboardClientProps = {
  initialMovie: string;
  initialFacts: FactDto[];
};

type FactCache = {
  movie: string;
  fact: FactDto;
  timestampMs: number;
};

const FACT_CACHE_TTL_MS = 30_000;

function factsForMovie(facts: FactDto[], movie: string): FactDto[] {
  if (!movie) return [];
  return facts.filter((fact) => fact.movie === movie);
}

function maybeRecentCache(movie: string, fact: FactDto | null): FactCache | null {
  if (!movie || !fact || fact.movie !== movie) return null;

  const createdAtMs = Date.parse(fact.createdAt);
  if (Number.isNaN(createdAtMs)) return null;

  const ageMs = Date.now() - createdAtMs;
  if (ageMs < 0 || ageMs > FACT_CACHE_TTL_MS) return null;

  return {
    movie,
    fact,
    timestampMs: createdAtMs,
  };
}

export default function DashboardClient({ initialMovie, initialFacts }: DashboardClientProps) {
  const [favoriteMovie, setFavoriteMovie] = useState(initialMovie);
  const [facts, setFacts] = useState(() => factsForMovie(initialFacts, initialMovie).slice(0, 1));
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);
  const [cache, setCache] = useState<FactCache | null>(() => {
    const latest = factsForMovie(initialFacts, initialMovie)[0] ?? null;
    return maybeRecentCache(initialMovie, latest);
  });
  const [factLoading, setFactLoading] = useState(false);
  const [factError, setFactError] = useState<string | null>(null);

  const currentFact = useMemo(() => facts[0] ?? null, [facts]);

  useEffect(() => {
    let active = true;

    async function loadMe() {
      try {
        const response = await apiClient.getMe();
        if (!active) return;

        const movie = response.me.favoriteMovie ?? "";
        const movieFacts = factsForMovie(response.recentFacts, movie).slice(0, 1);
        const latest = movieFacts[0] ?? null;

        setFavoriteMovie(movie);
        setFacts(movieFacts);
        setCache(maybeRecentCache(movie, latest));
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiClientError) {
          setMeError(error.message);
        } else {
          setMeError("Could not load profile");
        }
      } finally {
        if (active) setMeLoading(false);
      }
    }

    void loadMe();

    return () => {
      active = false;
    };
  }, []);

  const fetchFact = useCallback(
    async (forceNew: boolean) => {
      setFactLoading(true);
      setFactError(null);

      if (!forceNew && cache && cache.movie === favoriteMovie && Date.now() - cache.timestampMs < FACT_CACHE_TTL_MS) {
        setFacts([cache.fact]);
        setFactLoading(false);
        return;
      }

      try {
        const { fact } = await apiClient.getFact({ forceNew });
        setFacts([fact]);
        setCache({ movie: favoriteMovie, fact, timestampMs: Date.now() });
      } catch (error) {
        if (error instanceof ApiClientError) {
          setFactError(error.message);
        } else {
          setFactError("Could not load fact right now");
        }
      } finally {
        setFactLoading(false);
      }
    },
    [cache, favoriteMovie],
  );

  function handleMovieSaved(nextMovie: string) {
    setFavoriteMovie(nextMovie);
    setCache(null);
    setFacts([]);
    setFactError(null);
  }

  return (
    <>
      {meLoading && <p className="text-sm text-white/70">Loading profile...</p>}
      {meError && <p className="text-sm text-red-300">{meError}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <FavoriteCard favoriteMovie={favoriteMovie} onSaved={handleMovieSaved} />
        <FactsCard
          favoriteMovie={favoriteMovie}
          facts={facts}
          currentFact={currentFact}
          loading={factLoading}
          error={factError}
          onGetFact={() => fetchFact(false)}
          onGenerateNewFact={() => fetchFact(true)}
        />
      </div>
    </>
  );
}
