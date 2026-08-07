// ==========================================
// Items Module Types
// ==========================================
//
// Item = เสื้อ 1 ตัวที่แยกออกมาจาก Lot แล้ว
//

export interface CreateItemRequest {
  lotId: string;

  itemName: string;

  size?: string;

  condition?: string;

  costPrice: number;

  sellPrice: number;

  imageUrl?: string;
}

export interface UpdateItemRequest {
  // อนุญาตให้ย้ายสินค้าไปอยู่ล็อตอื่นได้ตอนแก้ไข (optional เพราะปกติไม่ค่อยเปลี่ยน)
  lotId?: string;

  itemName?: string;

  size?: string;

  condition?: string;

  costPrice?: number;

  sellPrice?: number;

  imageUrl?: string;
}

// ==========================================
// Bulk Create
// ==========================================
//
// ใช้ตอนแยกเสื้อจากกระสอบทีละ 2-3 ตัว ส่งเข้ามาพร้อมกันได้
//
// ตัวอย่าง:
//
// POST /api/items/bulk
// {
//   "lotId": "...",
//   "items": [
//     { "itemName": "เสื้อยืดลาย Nike", "size": "M", "costPrice": 20, "sellPrice": 89 },
//     { "itemName": "เสื้อยืดลาย Adidas", "size": "L", "costPrice": 20, "sellPrice": 79 }
//   ]
// }
//

export interface BulkCreateItemInput {
  itemName: string;

  size?: string;

  condition?: string;

  costPrice: number;

  sellPrice: number;

  imageUrl?: string;
}

export interface BulkCreateItemsRequest {
  lotId: string;

  items: BulkCreateItemInput[];
}

export interface ItemListQuery {
  status?: "IN_STOCK" | "SOLD";

  lotId?: string;
}
