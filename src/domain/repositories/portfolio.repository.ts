// Domain repository contract
import type { Portfolio } from "../entities/portfolio";

export interface IPortfolioRepository<
  T extends Portfolio | Promise<Portfolio> = Portfolio | Promise<Portfolio>
> {
  getPortfolioData(): T;
}
