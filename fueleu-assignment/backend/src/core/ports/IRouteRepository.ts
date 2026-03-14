
import type { PoolMember } from '../domain/entities';

export interface IRouteRepository {
  findById(routeId: string): unknown;
  createPool(year: number, members: PoolMember[]): Promise<string>;
}