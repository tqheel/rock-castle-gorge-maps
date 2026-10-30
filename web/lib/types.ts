export interface Route {
  label: string;
  track: [number, number][];
  distMi: number[];
  elevFt: number[];
  miles: number;
  gainFt: number;
  lossFt: number;
  startSnapM: number;
}

export interface RouteData {
  camp: { lat: number; lon: number; elevFt: number; snappedM: number };
  entry: { lat: number; lon: number; elevFt: number };
  routes: Record<string, Route>;
  loopTrail: [number, number][][];
}
