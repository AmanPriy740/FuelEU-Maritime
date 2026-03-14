
export interface Route {
    id: string;
    routeId: string;
    vesselType: string;
    fuelType: string;
    year: number;
    ghgIntensity: number;
    fuelConsumption: number;
    distance: number;
    totalEmissions: number;
    isBaseline: boolean;
  }
  
  export interface ShipCompliance {
    shipId: string;
    year: number;
    cbGco2eq: number; 
  }
  
  export interface PoolMember {
    shipId: string;
    cbBefore: number;
    cbAfter: number;
  }