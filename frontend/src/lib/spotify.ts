export const spotifySearchUrl = (query: string): string =>
  `https://open.spotify.com/search/${encodeURIComponent(query)}`
