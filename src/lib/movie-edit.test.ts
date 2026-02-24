import { describe, expect, it } from "vitest";
import {
  cancelMovieEdit,
  initialMovieEditState,
  movieSaveError,
  movieSaveSuccess,
  optimisticMovieSave,
  setMovieDraft,
  startMovieEdit,
} from "@/lib/movie-edit";

describe("movie edit state", () => {
  it("applies optimistic movie update when save starts", () => {
    const state = initialMovieEditState("The Matrix");
    const editing = startMovieEdit(state);
    const withDraft = setMovieDraft(editing, "Inception");

    const result = optimisticMovieSave(withDraft);

    expect(result.previousMovie).toBe("The Matrix");
    expect(result.nextMovie).toBe("Inception");
    expect(result.nextState.movie).toBe("Inception");
    expect(result.nextState.editing).toBe(false);
    expect(result.nextState.saving).toBe(true);
  });

  it("rolls back to previous movie when save fails", () => {
    const state = initialMovieEditState("The Matrix");
    const withDraft = setMovieDraft(startMovieEdit(state), "Inception");
    const pending = optimisticMovieSave(withDraft).nextState;

    const failed = movieSaveError(pending, "The Matrix", "Unauthorized");

    expect(failed.movie).toBe("The Matrix");
    expect(failed.draft).toBe("The Matrix");
    expect(failed.editing).toBe(true);
    expect(failed.saving).toBe(false);
    expect(failed.message).toBe("Unauthorized");
  });

  it("applies confirmed server value when save succeeds", () => {
    const state = initialMovieEditState("The Matrix");
    const pending = optimisticMovieSave(setMovieDraft(startMovieEdit(state), "Inception")).nextState;

    const saved = movieSaveSuccess(pending, "Inception");

    expect(saved.movie).toBe("Inception");
    expect(saved.draft).toBe("Inception");
    expect(saved.saving).toBe(false);
    expect(saved.message).toBe("Saved");
  });

  it("cancels draft changes and restores saved value", () => {
    const state = initialMovieEditState("The Matrix");
    const editing = setMovieDraft(startMovieEdit(state), "Inception");

    const canceled = cancelMovieEdit(editing);

    expect(canceled.movie).toBe("The Matrix");
    expect(canceled.draft).toBe("The Matrix");
    expect(canceled.editing).toBe(false);
  });
});
