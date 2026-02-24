"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [favoriteMovie, setFavoriteMovie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteMovie }),
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not save favorite movie");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0b0b0f] px-6 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-xs tracking-widest text-white/60">ONBOARDING</p>
        <h1 className="mt-2 text-3xl font-semibold">What is your favorite movie?</h1>
        <p className="mt-2 text-sm text-white/70">We use this to personalize your dashboard and generate fun facts.</p>

        <div className="mt-6 space-y-3">
          <input
            value={favoriteMovie}
            onChange={(e) => setFavoriteMovie(e.target.value)}
            placeholder="Ex: Interstellar"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-white/25"
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
