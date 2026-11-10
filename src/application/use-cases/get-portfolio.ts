// Application use case: Get portfolio data
import type { IPortfolioRepository } from "../../domain/repositories/portfolio.repository";
import type { Portfolio } from "../../domain/entities";

export class GetPortfolioUseCase<
  T extends Portfolio | Promise<Portfolio> = Portfolio
> {
  constructor(private readonly repository: IPortfolioRepository<T>) {}

  execute(): T {
    return this.repository.getPortfolioData();
  }
}
