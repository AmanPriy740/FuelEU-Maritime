
import type { ShipCompliance } from '../domain/entities';

export interface IShipComplianceRepository {
  getCompliance(shipId: string, year: number): Promise<ShipCompliance | null>;
  saveCompliance(compliance: ShipCompliance): Promise<void>;
}