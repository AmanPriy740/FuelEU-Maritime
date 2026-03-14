
import type { IShipComplianceRepository } from '../ports/IShipComplianceRepository';
import type { IPoolRepository } from '../ports/IPoolRepository';
import { ComplianceDomain } from '../domain/ComplianceDomain';
import type { PoolMember } from '../domain/entities';

export class CreatePoolUseCase {
  constructor(
    private complianceRepo: IShipComplianceRepository,
    private poolRepo: IPoolRepository
  ) {}

  async execute(shipIds: string[], year: number): Promise<PoolMember[]> {
    const membersData: { shipId: string; cb: number }[] = [];
    
    for (const shipId of shipIds) {
      const compliance = await this.complianceRepo.getCompliance(shipId, year);
      if (!compliance) throw new Error(`Compliance data missing for ship ${shipId}`);
      membersData.push({ shipId, cb: compliance.cbGco2eq });
    }

    const allocatedMembers = ComplianceDomain.allocatePool(membersData);

    await this.poolRepo.createPool(year, allocatedMembers);

    return allocatedMembers;
  }
}