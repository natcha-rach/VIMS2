// ==========================================================
// items.js — จัดการหน้า "สินค้า" (แยกเสื้อแต่ละตัวออกจากล็อต)
// ==========================================================
//
// เหมือน lots.js: เปลี่ยนแค่จุดที่เรียกข้อมูล (supabaseClient -> api.items/api.lots)
// logic เดิม (edit mode, filter, render) คงไว้เหมือนเดิมทั้งหมด
//

let allLots = [];
let editingItemId = null;

async function loadLotOptions() {
  // เดิม: supabaseClient.from("lots").select("id, lot_name").order(...)
  // ใหม่: เชื่อมกับ GET /api/lots (เอามาทั้งก้อน ใช้แค่ id/lot_name ที่ต้องใช้)
  // (backend เรียงล่าสุดก่อนให้แล้วเหมือนเดิม)
  const { data: lots, error } = await api.lots.list();

  if (error) {
    console.error(error);
    return;
  }
  allLots = lots;
  const select = document.getElementById("lotSelect");
  select.innerHTML = lots.length
    ? lots.map((l) => `<option value="${l.id}">${l.lot_name}</option>`).join("")
    : `<option value="">-- ยังไม่มีล็อต ไปเพิ่มที่หน้าล็อตก่อน --</option>`;
}

document.getElementById("itemForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const lotId = document.getElementById("lotSelect").value;
  if (!lotId) {
    showToast("กรุณาเพิ่มล็อตก่อน");
    return;
  }

  const payload = {
    lot_id: lotId,
    item_name: document.getElementById("itemName").value.trim(),
    size: document.getElementById("size").value.trim(),
    condition: document.getElementById("condition").value.trim(),
    cost_price: Number(document.getElementById("costPrice").value),
    sell_price: Number(document.getElementById("sellPrice").value),
  };

  if (editingItemId) {
    // โหมดแก้ไข: ไม่แตะ status เดิม (ในสต็อก/ขายแล้ว คงเดิม)
    // เดิม: supabaseClient.from("items").update(payload).eq("id", editingItemId)
    // ใหม่: เชื่อมกับ PATCH /api/items/:id
    // (backend จะปฏิเสธถ้าสินค้านี้ "ขายไปแล้ว" กันตัวเลขบัญชีย้อนหลังเพี้ยน — ดู items.service.ts)
    const { error } = await api.items.update(editingItemId, payload);
    if (error) {
      console.error(error);
      showToast("บันทึกไม่สำเร็จ: " + error.message);
      return;
    }
    showToast("แก้ไขข้อมูลเรียบร้อย");
    exitEditMode();
  } else {
    // ไม่ต้องตั้ง payload.status = "in_stock" เองอีกต่อไป
    // เพราะ backend ตั้งค่าเริ่มต้นเป็น IN_STOCK ให้อัตโนมัติเสมอ (ดู schema.prisma: status @default(IN_STOCK))
    // เดิม: supabaseClient.from("items").insert(payload)
    // ใหม่: เชื่อมกับ POST /api/items
    const { error } = await api.items.create(payload);
    if (error) {
      console.error(error);
      showToast("บันทึกไม่สำเร็จ: " + error.message);
      return;
    }
    showToast("เพิ่มเข้าสต็อกเรียบร้อย");
    document.getElementById("itemForm").reset();
  }

  loadItems();
});

document.getElementById("cancelItemEdit").addEventListener("click", exitEditMode);

function exitEditMode() {
  editingItemId = null;
  document.getElementById("itemForm").reset();
  document.getElementById("itemSubmitBtn").textContent = "เพิ่มเข้าสต็อก";
  document.getElementById("cancelItemEdit").classList.add("hidden");
}

function enterEditMode(item) {
  editingItemId = item.id;
  document.getElementById("lotSelect").value = item.lot_id || "";
  document.getElementById("itemName").value = item.item_name || "";
  document.getElementById("size").value = item.size || "";
  document.getElementById("condition").value = item.condition || "";
  document.getElementById("costPrice").value = item.cost_price;
  document.getElementById("sellPrice").value = item.sell_price;
  document.getElementById("itemSubmitBtn").textContent = "บันทึกการแก้ไข";
  document.getElementById("cancelItemEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("filterStatus").addEventListener("change", loadItems);

let itemsCache = [];

async function loadItems() {
  const filter = document.getElementById("filterStatus").value; // "all" | "in_stock" | "sold"

  // เดิม: supabaseClient.from("items").select("*").order(...).eq("status", filter)
  // ใหม่: เชื่อมกับ GET /api/items?status=IN_STOCK (api.items.list แปลงตัวพิมพ์ใหญ่/เช็ค "all" ให้เอง)
  const { data: items, error } = await api.items.list(filter);
  if (error) {
    console.error(error);
    document.getElementById("itemList").innerHTML = `<div class="empty-state">โหลดข้อมูลไม่สำเร็จ</div>`;
    return;
  }

  itemsCache = items;

  if (!items.length) {
    document.getElementById("itemList").innerHTML = `<div class="empty-state">ไม่มีสินค้าในหมวดนี้</div>`;
    return;
  }

  const html = items
    .map(
      (item) => `
      <div class="tag-card item-row">
        <div class="item-row-top">
          <div>
            <div class="item-name">${item.item_name}</div>
            <div class="item-meta">${item.size || ""} ${item.condition ? "· " + item.condition : ""}</div>
          </div>
          <span class="badge ${item.status}">${item.status === "in_stock" ? "ในสต็อก" : "ขายแล้ว"}</span>
        </div>
        <div class="item-row-prices">
          <span>ต้นทุน ${formatBaht(item.cost_price)}</span>
          <span class="item-sell-price">ขาย ${formatBaht(item.sell_price)}</span>
        </div>
        <div class="item-actions">
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${item.id}">แก้ไข</button>
          ${
            item.status === "sold"
              ? `<button class="btn btn-ghost btn-sm" data-action="undo" data-id="${item.id}">ยกเลิกการขาย</button>`
              : ""
          }
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">ลบ</button>
        </div>
      </div>`
    )
    .join("");

  document.getElementById("itemList").innerHTML = html;

  document.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = itemsCache.find((i) => i.id === btn.dataset.id);
      if (item) enterEditMode(item);
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.id));
  });

  document.querySelectorAll('[data-action="undo"]').forEach((btn) => {
    btn.addEventListener("click", () => handleUndoSale(btn.dataset.id));
  });
}

async function handleDelete(itemId) {
  const item = itemsCache.find((i) => i.id === itemId);
  const ok = confirm(
    `ลบ "${item ? item.item_name : "สินค้านี้"}" ใช่ไหม?\n(ถ้าเคยขายไปแล้ว ประวัติการขายจะยังอยู่ในรายงาน แต่จะไม่โยงกับชื่อสินค้านี้อีก)`
  );
  if (!ok) return;

  // เดิม: supabaseClient.from("items").delete().eq("id", itemId)
  // ใหม่: เชื่อมกับ DELETE /api/items/:id
  // (backend ปฏิเสธถ้าสินค้านี้ขายไปแล้ว ต้องยกเลิกการขายก่อนถึงจะลบได้ — ต่างจาก Supabase เดิมที่ลบได้เสมอ)
  const { error } = await api.items.delete(itemId);
  if (error) {
    console.error(error);
    showToast("ลบไม่สำเร็จ: " + error.message);
    return;
  }
  showToast("ลบสินค้าเรียบร้อย");
  if (editingItemId === itemId) exitEditMode();
  loadItems();
}

async function handleUndoSale(itemId) {
  const ok = confirm("ยกเลิกการขายชิ้นนี้และคืนเข้าสต็อกใช่ไหม? (รายการขายที่บันทึกไว้จะถูกลบออกจากรายงานด้วย)");
  if (!ok) return;

  // เดิม: ต้องยิง 2 คำสั่งแยกกัน (ลบแถวใน "sales" + update status ของ "items")
  // ซึ่งมีความเสี่ยงว่าคำสั่งแรกสำเร็จแต่คำสั่งที่สองพลาด (ข้อมูลจะค้างไม่ตรงกัน)
  //
  // ใหม่: เชื่อมกับ POST /api/items/:id/cancel-sale จุดเดียว
  // backend รวมทั้ง 2 ขั้นตอนไว้ใน transaction เดียวกัน (ดู sales.repository.ts: cancelSale)
  // ทำให้ไม่มีทางเกิดเคส "ลบรายการขายไปแล้วแต่คืนสต็อกไม่สำเร็จ" อีกต่อไป
  const { error } = await api.items.cancelSale(itemId);
  if (error) {
    console.error(error);
    showToast("ยกเลิกไม่สำเร็จ: " + error.message);
    return;
  }

  showToast("ยกเลิกการขายและคืนสต็อกเรียบร้อย");
  loadItems();
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

loadLotOptions();
loadItems();
