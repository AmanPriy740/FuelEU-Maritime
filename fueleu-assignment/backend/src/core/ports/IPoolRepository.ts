
import type { PoolMember } from '../domain/entities';

export interface IPoolRepository {
  createPool(year: number, members: PoolMember[]): Promise<string>;
}