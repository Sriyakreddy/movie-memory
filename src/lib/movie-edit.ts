export type MovieEditState = {
  movie: string;
  draft: string;
  editing: boolean;
  saving: boolean;
  message: string | null;
};

export function initialMovieEditState(movie: string): MovieEditState {
  return {
    movie,
    draft: movie,
    editing: false,
    saving: false,
    message: null,
  };
}

export function startMovieEdit(state: MovieEditState): MovieEditState {
  return {
    ...state,
    editing: true,
    message: null,
  };
}

export function cancelMovieEdit(state: MovieEditState): MovieEditState {
  return {
    ...state,
    draft: state.movie,
    editing: false,
    message: null,
  };
}

export function setMovieDraft(state: MovieEditState, draft: string): MovieEditState {
  return {
    ...state,
    draft,
  };
}

export function optimisticMovieSave(state: MovieEditState): { nextState: MovieEditState; previousMovie: string; nextMovie: string } {
  const nextMovie = state.draft.trim();
  return {
    previousMovie: state.movie,
    nextMovie,
    nextState: {
      ...state,
      movie: nextMovie,
      editing: false,
      saving: true,
      message: null,
    },
  };
}

export function movieSaveSuccess(state: MovieEditState, savedMovie: string): MovieEditState {
  return {
    ...state,
    movie: savedMovie,
    draft: savedMovie,
    saving: false,
    message: "Saved",
  };
}

export function movieSaveError(state: MovieEditState, previousMovie: string, message: string): MovieEditState {
  return {
    ...state,
    movie: previousMovie,
    draft: previousMovie,
    editing: true,
    saving: false,
    message,
  };
}
