import { salesRepository } from "./sales.repository.js";
import { SellItemRequest, SalesListQuery } from "./sales.types.js";

export class SalesService {

  async sellItem(itemId: string, data: SellItemRequest) {
    return salesRepository.sellItem(itemId, data);
  }

  async cancelSale(itemId: string) {
    return salesRepository.cancelSale(itemId);
  }

  async listSales(query: SalesListQuery) {
    return salesRepository.findAll(query);
  }

}

export const salesService = new SalesService();
