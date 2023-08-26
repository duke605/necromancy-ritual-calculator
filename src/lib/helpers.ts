export const ucfirst = (s: string) => {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const mapFromJson = <R>(json: string): Map<string, R> => {
  return new Map(Object.entries(JSON.parse(json)));
}

export const mapToJson = <R>(map: Map<string, R>): string => {
  return JSON.stringify(Object.fromEntries(map));
}