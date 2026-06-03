export type Ship = {
  id: string;
  name: string;
  routeIndex: number;
  progress: number;
};

export function createFleet(): Ship[] {
  return [
    { id: 's1', name: 'Neptune Carrier', routeIndex: 0, progress: 0 },
    { id: 's2', name: 'Ocean Titan', routeIndex: 1, progress: 0.3 },
    { id: 's3', name: 'Pacific Star', routeIndex: 2, progress: 0.6 },
  ];
}

export function updateFleet(fleet: Ship[]): Ship[] {
  return fleet.map((ship) => ({
    ...ship,
    progress: ship.progress >= 1 ? 0 : ship.progress + 0.005,
  }));
}
