export type Vessel = {
  id: string;
  name: string;
  type: string;
  stwKnots: number;
  baseFuelTPD: number;
  fuelPricePerTon: number;
  fuelCapacity: number;
};

export const vessel: Vessel = {
  id: 'v1',
  name: 'Neptune Carrier',
  type: 'cargo',
  stwKnots: 14,
  baseFuelTPD: 45,
  fuelPricePerTon: 650,
  fuelCapacity: 5000,
};
