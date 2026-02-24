export type FactDto = {
  id: string;
  movie: string;
  text: string;
  createdAt: string;
};

export type MeDto = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  favoriteMovie: string | null;
};

export type GetMeResponse = {
  me: MeDto;
  recentFacts: FactDto[];
};

export type UpdateMovieRequest = {
  favoriteMovie: string;
};

export type UpdateMovieResponse = {
  favoriteMovie: string;
};

export type GetFactResponse = {
  fact: FactDto;
  cached: boolean;
};

export type ErrorResponse = {
  error: string;
};
