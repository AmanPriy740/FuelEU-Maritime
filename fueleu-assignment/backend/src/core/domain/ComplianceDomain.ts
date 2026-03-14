
import type { PoolMember } from './entities';

export const TARGET_INTENSITY_2025 = 89.3368;
export const MJ_PER_TONNE = 41000;

export class ComplianceDomain {
  
  static calculateEnergy(fuelConsumptionTonnes: number): number {
    return fuelConsumptionTonnes * MJ_PER_TONNE;
  }

  
  static calculateCB(actualIntensity: number, fuelConsumptionTonnes: number): number {
    const energy = this.calculateEnergy(fuelConsumptionTonnes);
    return (TARGET_INTENSITY_2025 - actualIntensity) * energy;
  }

  
  static allocatePool(members: { shipId: string; cb: number }[]): PoolMember[] {
    const totalCb = members.reduce((sum, m) => sum + m.cb, 0);
    if (totalCb < 0) {
      throw new Error("Invalid Pool: Sum of Compliance Balances is less than 0.");
    }

    const surpluses = members.filter(m => m.cb > 0).sort((a, b) => b.cb - a.cb);
    const deficits = members.filter(m => m.cb < 0).sort((a, b) => a.cb - b.cb);

    let surplusIndex = 0;
    
    
    const results: Record<string, PoolMember> = {};
    members.forEach(m => {
        results[m.shipId] = { shipId: m.shipId, cbBefore: m.cb, cbAfter: m.cb };
    });

   
    for (const deficit of deficits) {
      let remainingDeficit = Math.abs(deficit.cb);

      while (remainingDeficit > 0 && surplusIndex < surpluses.length) {
        const currentSurplus = surpluses[surplusIndex]!;
        const surplusAvailable = results[currentSurplus.shipId]!.cbAfter;

        if (surplusAvailable >= remainingDeficit) {
          results[currentSurplus.shipId]!.cbAfter -= remainingDeficit;
          results[deficit.shipId]!.cbAfter = 0;
          remainingDeficit = 0;
        } else {
          results[deficit.shipId]!.cbAfter += surplusAvailable;
          remainingDeficit -= surplusAvailable;
          results[currentSurplus.shipId]!.cbAfter = 0;
          surplusIndex++;
        }
      }
    }

    return Object.values(results);
  }
}