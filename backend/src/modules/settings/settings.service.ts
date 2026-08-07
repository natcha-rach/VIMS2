import { settingsRepository } from "./settings.repository.js";
import { MoneyBucketsSettings, MoneyBucketCalculationResult } from "./settings.types.js";

export class SettingsService {

  async getMoneyBuckets() {
    return settingsRepository.getMoneyBuckets();
  }

  async updateMoneyBuckets(data: MoneyBucketsSettings) {
    return settingsRepository.setMoneyBuckets(data);
  }

  async calculateMoneyBuckets(amount: number): Promise<MoneyBucketCalculationResult[]> {
    const settings = await settingsRepository.getMoneyBuckets();

    return settings.buckets.map((bucket: any) => ({
      ...bucket,
      amount: Math.round(((amount * bucket.percent) / 100) * 100) / 100, // ปัดทศนิยม 2 ตำแหน่ง
    }));
  }

}

export const settingsService = new SettingsService();
