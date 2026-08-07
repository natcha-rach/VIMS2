import prisma from "../../common/database/prisma.js";
import { MoneyBucketsSettings } from "./settings.types.js";

const MONEY_BUCKETS_KEY = "money_buckets";

// ดีฟอลต์ตอนยังไม่เคยตั้งค่า: เก็บต้นทุน / ใช้หนี้รายเดือน / สำรอง / ค่าใช้จ่ายอื่น
const DEFAULT_BUCKETS: MoneyBucketsSettings = {
  buckets: [
    { key: "cost_reserve", label: "เก็บต้นทุน", percent: 40 },
    { key: "debt_payment", label: "ใช้หนี้รายเดือน", percent: 20 },
    { key: "reserve", label: "สำรอง", percent: 20 },
    { key: "other_expense", label: "ค่าใช้จ่ายอื่น", percent: 20 },
  ],
};

export class SettingsRepository {

  async getMoneyBuckets(): Promise<MoneyBucketsSettings> {
    const setting = await prisma.appSetting.findUnique({
      where: { key: MONEY_BUCKETS_KEY },
    });

    if (!setting) {
      return DEFAULT_BUCKETS;
    }

    return setting.value as unknown as MoneyBucketsSettings;
  }

  async setMoneyBuckets(value: MoneyBucketsSettings) {
    const setting = await prisma.appSetting.upsert({
      where: { key: MONEY_BUCKETS_KEY },
      create: { key: MONEY_BUCKETS_KEY, value: value as any },
      update: { value: value as any },
    });

    return setting.value as unknown as MoneyBucketsSettings;
  }

}

export const settingsRepository = new SettingsRepository();
