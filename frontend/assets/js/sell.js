// ==========================================================
// sell.js — หน้าขายหน้างาน (ตลาดนัด/ถนนคนเดิน) กดขายทีละชิ้น
// ==========================================================

let inStockItems = [];

async function loadSellGrid() {
  // เดิม: supabaseClient.from("items").select("*").eq("status","in_stock").order(...)
  // ใหม่: เชื่อมกับ GET /api/items?status=IN_STOCK
  // ส่ง "in_stock" (ตัวพิมพ์เล็ก) เข้าไปตรงๆ ได้ เพราะ api.items.list() แปลงเป็นตัวพิมพ์ใหญ่ให้เอง
  const { data: items, error } = await api.items.list("in_stock");

  if (error) {
    console.error(error);
    document.getElementById("sellGrid").innerHTML = `<div class="empty-state">โหลดข้อมูลไม่สำเร็จ</div>`;
    return;
  }

  inStockItems = items;
  renderGrid(items);
}

function renderGrid(items) {
  if (!items.length) {
    document.getElementById("sellGrid").innerHTML = `<div class="empty-state">ไม่มีของในสต็อกให้ขาย</div>`;
    return;
  }

  const html = items
    .map(
      (item) => `
      <button class="item-tile" data-id="${item.id}">
        <div class="name">${item.item_name}</div>
        <div class="meta">${item.size || ""} ${item.condition ? "· " + item.condition : ""}</div>
        <div class="price">${formatBaht(item.sell_price)}</div>
      </button>`
    )
    .join("");

  document.getElementById("sellGrid").innerHTML = html;

  document.querySelectorAll(".item-tile").forEach((tile) => {
    tile.addEventListener("click", () => openSellModal(tile.dataset.id));
  });
}

document.getElementById("searchBox").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = inStockItems.filter((i) => i.item_name.toLowerCase().includes(q));
  renderGrid(filtered);
});

function openSellModal(itemId) {
  const item = inStockItems.find((i) => i.id === itemId);
  if (!item) return;

  document.getElementById("modalItemId").value = item.id;
  document.getElementById("modalItemName").textContent = item.item_name;
  document.getElementById("modalItemMeta").textContent =
    `${item.size || ""} ${item.condition ? "· " + item.condition : ""} · ต้นทุน ${formatBaht(item.cost_price)}`;
  document.getElementById("salePrice").value = item.sell_price;
  document.getElementById("sellModal").classList.remove("hidden");
}

document.getElementById("cancelSell").addEventListener("click", () => {
  document.getElementById("sellModal").classList.add("hidden");
});

document.getElementById("sellForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const itemId = document.getElementById("modalItemId").value;
  const item = inStockItems.find((i) => i.id === itemId);
  if (!item) return;

  const salePrice = Number(document.getElementById("salePrice").value);
  const paymentMethod = document.getElementById("paymentMethod").value;
  const channel = document.getElementById("channel").value.trim() || "ถนนคนเดิน";

  // เดิม: ต้องยิง 2 คำสั่งแยกกัน
  //   1) supabaseClient.from("sales").insert({...})   -> บันทึกรายการขาย
  //   2) supabaseClient.from("items").update({status:"sold"}).eq("id", item.id) -> ตัดสต็อก
  // ปัญหาของแบบเดิม: ถ้าคำสั่งที่ 1 สำเร็จแต่คำสั่งที่ 2 พลาด (เช่นเน็ตหลุดกลางคัน)
  // จะกลายเป็น "มีรายการขายในระบบ แต่สินค้ายังโชว์ว่าอยู่ในสต็อก" ข้อมูลไม่ตรงกัน
  //
  // ใหม่: เรียกทีเดียวจบที่ POST /api/items/:id/sell
  // backend ทำทั้ง 2 ขั้นตอน (สร้าง Sale + เปลี่ยนสถานะ Item) อยู่ใน transaction เดียวกัน
  // ถ้าขั้นตอนไหนพลาด จะ rollback ทั้งหมด ไม่มีทางเกิดข้อมูลค้างไม่ตรงกัน
  // (ดู src/modules/sales/sales.repository.ts: sellItem)
  //
  // หมายเหตุ: ไม่ต้องส่ง cost_price จากฝั่งเว็บอีกต่อไป เพราะ backend จะไปดึงต้นทุน
  // ปัจจุบันของสินค้าชิ้นนี้มาเก็บไว้ในรายการขายเองอัตโนมัติ (กันเผลอส่งค่าผิด)
  const { error } = await api.items.sell(item.id, {
    sale_price: salePrice,
    payment_method: paymentMethod,
    channel: channel,
  });

  if (error) {
    console.error(error);
    showToast("บันทึกการขายไม่สำเร็จ: " + error.message);
    return;
  }

  document.getElementById("sellModal").classList.add("hidden");
  showToast(`ขาย "${item.item_name}" สำเร็จ ตัดสต็อกแล้ว`);
  loadSellGrid();
});

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

loadSellGrid();
