
import type { IRouteRepository } from '../ports/IRouteRepository';
import type { IShipComplianceRepository } from '../ports/IShipComplianceRepository';
import { ComplianceDomain } from '../domain/ComplianceDomain';
import type { ShipCompliance } from '../domain/entities';

export class CalculateComplianceBalanceUseCase {
  constructor(
    private routeRepo: IRouteRepository,
    private complianceRepo: IShipComplianceRepository
  ) {}

  async execute(routeId: string, year: number): Promise<ShipCompliance> {
    const route = await this.routeRepo.findById(routeId) as { routeId: string; ghgIntensity: number; fuelConsumption: number };
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