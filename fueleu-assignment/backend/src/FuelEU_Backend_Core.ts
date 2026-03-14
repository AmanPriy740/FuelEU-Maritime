/**
 * ---------------------------------------------------------
 * BACKEND: HEXAGONAL ARCHITECTURE SHOWCASE
 * ---------------------------------------------------------
 * This file consolidates the Core Domain, Ports, and Application
 * Use Cases for the Node.js Backend. In a real repo, these 
 * would be separated into multiple files within src/core/
 */

// ==========================================
// 1. DOMAIN (src/core/domain)
// ==========================================

export const TARGET_INTENSITY_2025 = 89.3368;
export const MJ_PER_TONNE = 41000;

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

export class ComplianceDomain {
  /**
   * Energy in scope (MJ) ≈ fuelConsumption × 41 000 MJ/t
   */
  static calculateEnergy(fuelConsumptionTonnes: number): number {
    return fuelConsumptionTonnes * MJ_PER_TONNE;
  }

  /**
   * Compliance Balance = ( Target − Actual ) × Energy in scope
   * Positive CB → Surplus ; Negative → Deficit
   */
  static calculateCB(actualIntensity: number, fuelConsumptionTonnes: number): number {
    const energy = this.calculateEnergy(fuelConsumptionTonnes);
    return (TARGET_INTENSITY_2025 - actualIntensity) * energy;
  }

  /**
   * Greedy allocation for pooling
   */
  static allocatePool(members: { shipId: string, cb: number }[]): PoolMember[] {
    const totalCb = members.reduce((sum, m) => sum + m.cb, 0);
    if (totalCb < 0) {
      throw new Error("Invalid Pool: Sum of Compliance Balances is less than 0.");
    }

    const surpluses = members.filter(m => m.cb > 0).sort((a, b) => b.cb - a.cb);
    const deficits = members.filter(m => m.cb < 0).sort((a, b) => a.cb - b.cb);
    const zeroBalances = members.filter(m => m.cb === 0);

    let surplusIndex = 0;
    
    // Create tracking objects
    const results: Record<string, PoolMember> = {};
    members.forEach(m => {
        results[m.shipId] = { shipId: m.shipId, cbBefore: m.cb, cbAfter: m.cb };
    });

    // Resolve deficits
    for (const deficit of deficits) {
      let remainingDeficit = Math.abs(deficit.cb);

      while (remainingDeficit > 0 && surplusIndex < surpluses.length) {
        const currentSurplus = surpluses[surplusIndex];
        const surplusAvailable = results[currentSurplus.shipId].cbAfter;

        if (surplusAvailable >= remainingDeficit) {
          // Surplus can fully cover this deficit
          results[currentSurplus.shipId].cbAfter -= remainingDeficit;
          results[deficit.shipId].cbAfter = 0;
          remainingDeficit = 0;
        } else {
          // Surplus partially covers the deficit
          results[deficit.shipId].cbAfter += surplusAvailable;
          remainingDeficit -= surplusAvailable;
          results[currentSurplus.shipId].cbAfter = 0;
          surplusIndex++;
        }
      }
    }

    return Object.values(results);
  }
}

// ==========================================
// 2. PORTS (src/core/ports)
// ==========================================

export interface IRouteRepository {
  findAll(): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  setBaseline(id: string): Promise<void>;
  getBaseline(): Promise<Route | null>;
}

export interface IShipComplianceRepository {
  getCompliance(shipId: string, year: number): Promise<ShipCompliance | null>;
  saveCompliance(compliance: ShipCompliance): Promise<void>;
}

export interface IPoolRepository {
  createPool(year: number, members: PoolMember[]): Promise<string>;
}

// ==========================================
// 3. APPLICATION USE CASES (src/core/application)
// ==========================================

export class CalculateComplianceBalanceUseCase {
  constructor(
    private routeRepo: IRouteRepository,
    private complianceRepo: IShipComplianceRepository
  ) {}

  async execute(routeId: string, year: number): Promise<ShipCompliance> {
    const route = await this.routeRepo.findById(routeId);
    if (!route) throw new Error("Route not found");

    const cb = ComplianceDomain.calculateCB(route.ghgIntensity, route.fuelConsumption);
    
    const compliance: ShipCompliance = {
      shipId: route.routeId,
      year,
      cbGco2eq: cb
    };

    await this.complianceRepo.saveCompliance(compliance);
    return compliance;
  }
}

export class CreatePoolUseCase {
  constructor(
    private complianceRepo: IShipComplianceRepository,
    private poolRepo: IPoolRepository
  ) {}

  async execute(shipIds: string[], year: number): Promise<PoolMember[]> {
    const membersData = [];
    
    for (const shipId of shipIds) {
      const compliance = await this.complianceRepo.getCompliance(shipId, year);
      if (!compliance) throw new Error(`Compliance data missing for ship ${shipId}`);
      membersData.push({ shipId, cb: compliance.cbGco2eq });
    }

    // Domain logic execution
    const allocatedMembers = ComplianceDomain.allocatePool(membersData);

    // Persistence via port
    await this.poolRepo.createPool(year, allocatedMembers);

    return allocatedMembers;
  }
}