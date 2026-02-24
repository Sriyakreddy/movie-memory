"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api";
import {
  cancelMovieEdit,
  initialMovieEditState,
  movieSaveError,
  movieSaveSuccess,
  optimisticMovieSave,
  setMovieDraft,
  startMovieEdit,
} from "@/lib/movie-edit";

type FavoriteCardProps = {
  favoriteMovie: string;
  onSaved: (movie: string) => void;
};

export default function FavoriteCard({ favoriteMovie, onSaved }: FavoriteCardProps) {
  const [state, setState] = useState(() => initialMovieEditState(favoriteMovie));

  async function saveMovie() {
    const snapshot = optimisticMovieSave(state);
    setState(snapshot.nextState);

    try {
      const response = await apiClient.updateMovie({ favoriteMovie: snapshot.nextMovie });
      setState((current) => movieSaveSuccess(current, response.favoriteMovie));
      onSaved(response.favoriteMovie);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setState((current) => movieSaveError(current, snapshot.previousMovie, error.message));
      } else {
        setState((current) => movieSaveError(current, snapshot.previousMovie, "Could not save movie"));
      }
    }
  }

  function cancelEdit() {
    setState((current) => cancelMovieEdit(current));
  }

  return (
    <div id="favorite" className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="text-xs tracking-widest text-white/60">MY FAVORITE</div>
      <h2 className="mt-2 text-xl font-bold">Favorite Movie</h2>

      {!state.editing ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
            <span className="text-white/60">Current:</span>{" "}
            <span className="font-semibold text-white">{state.movie}</span>
          </div>
          <button
            onClick={() => setState((current) => startMovieEdit(current))}
            disabled={state.saving}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
          >
            Edit Movie
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <input
            value={state.draft}
            onChange={(e) => setState((current) => setMovieDraft(current, e.target.value))}
            placeholder="Ex: Interstellar"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={saveMovie}
              disabled={state.saving}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
            >
              {state.saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              disabled={state.saving}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {state.message && <div className="mt-4 text-sm text-white/80">{state.message}</div>}
    </div>
  );
}
