export const MIN_MOVIE_LENGTH = 2;
export const MAX_MOVIE_LENGTH = 120;

export function normalizeMovieInput(input: unknown): string {
  return String(input ?? "").trim();
}

export function validateMovieInput(movie: string): string | null {
  if (movie.length < MIN_MOVIE_LENGTH || movie.length > MAX_MOVIE_LENGTH) {
    return `Favorite movie must be between ${MIN_MOVIE_LENGTH} and ${MAX_MOVIE_LENGTH} characters`;
  }
  return null;
}
