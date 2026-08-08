// ==========================================================
// items.js — จัดการหน้า "สินค้า" (แยกเสื้อแต่ละตัวออกจากล็อต)
// ==========================================================
//
// เหมือน lots.js: เปลี่ยนแค่จุดที่เรียกข้อมูล (supabaseClient -> api.items/api.lots)
// logic เดิม (edit mode, filter, render) คงไว้เหมือนเดิมทั้งหมด
//

let allLots = [];
let editingItemId = null;

// เก็บ URL ของรูปที่อัปโหลดสำเร็จแล้ว รอตอนกด submit ฟอร์มค่อยแนบไปด้วย
// (อัปโหลดทันทีตอนเลือกไฟล์ ไม่ใช่ตอน submit เพื่อให้เห็นพรีวิว/สถานะก่อนกดบันทึกจริง)
let pendingSingleImageUrl = null;

// ==========================================================
// สลับโหมด: เพิ่มทีละชิ้น / เพิ่มหลายชิ้นพร้อมกัน
// ==========================================================
document.querySelectorAll(".add-mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".add-mode-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const mode = tab.dataset.mode; // "single" | "bulk"
    document.getElementById("singleAddSection").classList.toggle("hidden", mode !== "single");
    document.getElementById("bulkAddSection").classList.toggle("hidden", mode !== "bulk");

    // ตอนสลับมาโหมด bulk ครั้งแรก ให้มีอย่างน้อย 1 แถวเสมอ
    if (mode === "bulk" && document.getElementById("bulkRows").children.length === 0) {
      addBulkRow();
    }
  });
});

// ==========================================================
// อัปโหลดรูป (โหมดเพิ่มทีละชิ้น)
// ==========================================================
document.getElementById("itemImageFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const preview = document.getElementById("itemImagePreview");
  const statusEl = document.getElementById("itemImageStatus");

  // โชว์พรีวิวรูปทันทีจากไฟล์ในเครื่อง (ยังไม่ต้องรออัปโหลดเสร็จ)
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
  statusEl.textContent = "กำลังอัปโหลด...";
  pendingSingleImageUrl = null;

  // เชื่อมกับ api.uploadImage() ใน apiClient.js -> ยิงตรงไป Cloudinary
  const { url, error } = await api.uploadImage(file);

  if (error) {
    statusEl.textContent = "อัปโหลดไม่สำเร็จ: " + error.message;
    return;
  }

  pendingSingleImageUrl = url;
  statusEl.textContent = "อัปโหลดสำเร็จ";
});

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
  const optionsHtml = lots.length
    ? lots.map((l) => `<option value="${l.id}">${l.lot_name}</option>`).join("")
    : `<option value="">-- ยังไม่มีล็อต ไปเพิ่มที่หน้าล็อตก่อน --</option>`;

  // มี select 2 ตัวที่ต้องเติมล็อตเหมือนกัน (โหมดทีละชิ้น + โหมดหลายชิ้น)
  document.getElementById("lotSelect").innerHTML = optionsHtml;
  document.getElementById("bulkLotSelect").innerHTML = optionsHtml;
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
    // แนบ URL รูปที่อัปโหลดไว้แล้ว (ถ้ามี) — มาจาก handler "change" ของ itemImageFile ด้านบน
    image_url: pendingSingleImageUrl || undefined,
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
    resetImageField();
  }

  loadItems();
});

document.getElementById("cancelItemEdit").addEventListener("click", exitEditMode);

function exitEditMode() {
  editingItemId = null;
  document.getElementById("itemForm").reset();
  document.getElementById("itemSubmitBtn").textContent = "เพิ่มเข้าสต็อก";
  document.getElementById("cancelItemEdit").classList.add("hidden");
  resetImageField();
}

function resetImageField() {
  pendingSingleImageUrl = null;
  const preview = document.getElementById("itemImagePreview");
  preview.src = "";
  preview.style.display = "none";
  document.getElementById("itemImageStatus").textContent = "";
  document.getElementById("itemImageFile").value = "";
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

  // ถ้าสินค้านี้เคยมีรูปอยู่แล้ว โชว์พรีวิวรูปเดิมไว้ก่อน (ยังไม่ได้อัปโหลดใหม่จนกว่าจะเลือกไฟล์)
  resetImageField();
  if (item.image_url) {
    pendingSingleImageUrl = item.image_url;
    const preview = document.getElementById("itemImagePreview");
    preview.src = item.image_url;
    preview.style.display = "block";
    document.getElementById("itemImageStatus").textContent = "ใช้รูปเดิม (เลือกไฟล์ใหม่เพื่อเปลี่ยน)";
  }

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
          <div style="display:flex; gap:10px; align-items:flex-start;">
            ${item.image_url ? `<img src="${item.image_url}" class="image-preview" style="width:44px;height:44px;" />` : ""}
            <div>
              <div class="item-name">${item.item_name}</div>
              <div class="item-meta">${item.size || ""} ${item.condition ? "· " + item.condition : ""}</div>
            </div>
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

// ==========================================================
// โหมดเพิ่มหลายชิ้นพร้อมกัน (Bulk Add)
// ==========================================================
//
// แต่ละแถวเก็บ state ของตัวเองไว้ใน object `bulkRowsState`
// (key = แถวลำดับที่เท่าไหร่ นับตั้งแต่ 0, value = { imageUrl })
// เพราะ field name/cost/sell กรอกในช่อง input ได้ตรงๆ อยู่แล้ว แต่ image_url
// ต้องรออัปโหลดเสร็จก่อน จึงต้องมีที่พักค่าไว้แยกจาก DOM เหมือนโหมดทีละชิ้น
//

let bulkRowCounter = 0;
const bulkRowsState = {};

document.getElementById("addBulkRowBtn").addEventListener("click", () => addBulkRow());

function addBulkRow() {
  const rowIndex = bulkRowCounter++;
  bulkRowsState[rowIndex] = { imageUrl: null };

  const row = document.createElement("div");
  row.className = "bulk-row";
  row.dataset.rowIndex = rowIndex;
  row.innerHTML = `
    <button type="button" class="bulk-row-remove" data-remove="${rowIndex}">ลบแถวนี้ ✕</button>
    <div class="field">
      <label>ชื่อ/รายละเอียดเสื้อ</label>
      <input type="text" class="bulk-item-name" placeholder="เช่น เสื้อยืดลาย Nike สีดำ" required />
    </div>
    <div class="field-row">
      <div class="field">
        <label>ไซซ์</label>
        <input type="text" class="bulk-size" placeholder="M / L / XL" />
      </div>
      <div class="field">
        <label>สภาพ</label>
        <input type="text" class="bulk-condition" placeholder="ดีมาก" />
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>ต้นทุน/ชิ้น (บาท)</label>
        <input type="number" class="bulk-cost-price" step="0.01" min="0" required />
      </div>
      <div class="field">
        <label>ราคาตั้งขาย (บาท)</label>
        <input type="number" class="bulk-sell-price" step="0.01" min="0" required />
      </div>
    </div>
    <div class="field">
      <label>รูปสินค้า (ถ้ามี)</label>
      <div class="image-upload-field">
        <img class="image-preview bulk-image-preview" style="display: none" />
        <input type="file" class="bulk-image-file" accept="image/*" capture="environment" />
      </div>
      <div class="image-upload-status bulk-image-status"></div>
    </div>
  `;

  document.getElementById("bulkRows").appendChild(row);

  // ผูก event อัปโหลดรูปของแถวนี้โดยเฉพาะ (เหมือน logic ในโหมดทีละชิ้น แต่ผูกกับ state ของแถวนี้)
  row.querySelector(".bulk-image-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = row.querySelector(".bulk-image-preview");
    const statusEl = row.querySelector(".bulk-image-status");

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    statusEl.textContent = "กำลังอัปโหลด...";
    bulkRowsState[rowIndex].imageUrl = null;

    const { url, error } = await api.uploadImage(file);
    if (error) {
      statusEl.textContent = "อัปโหลดไม่สำเร็จ: " + error.message;
      return;
    }
    bulkRowsState[rowIndex].imageUrl = url;
    statusEl.textContent = "อัปโหลดสำเร็จ";
  });

  // ปุ่มลบแถว (ลบได้เฉพาะตอนยังไม่ submit — หลัง submit ไปแล้วแถวจะหายไปทั้งชุดอยู่แล้ว)
  row.querySelector("[data-remove]").addEventListener("click", () => {
    delete bulkRowsState[rowIndex];
    row.remove();
  });
}

document.getElementById("submitBulkBtn").addEventListener("click", async () => {
  const lotId = document.getElementById("bulkLotSelect").value;
  if (!lotId) {
    showToast("กรุณาเลือกล็อตก่อน");
    return;
  }

  const rows = document.querySelectorAll("#bulkRows .bulk-row");
  if (!rows.length) {
    showToast("ยังไม่มีแถวสินค้าให้บันทึกเลย");
    return;
  }

  // รวบรวมข้อมูลจากทุกแถวเป็น array เดียว ก่อนส่งเข้า api.items.bulkCreate()
  // (backend รับเป็น array ทีเดียว บันทึกทั้งหมดเป็น transaction เดียวกัน — ดู items.repository.ts: createMany)
  const items = [];
  let hasInvalid = false;

  rows.forEach((row) => {
    const rowIndex = row.dataset.rowIndex;
    const itemName = row.querySelector(".bulk-item-name").value.trim();
    const costPrice = row.querySelector(".bulk-cost-price").value;
    const sellPrice = row.querySelector(".bulk-sell-price").value;

    if (!itemName || costPrice === "" || sellPrice === "") {
      hasInvalid = true;
      return;
    }

    items.push({
      item_name: itemName,
      size: row.querySelector(".bulk-size").value.trim(),
      condition: row.querySelector(".bulk-condition").value.trim(),
      cost_price: Number(costPrice),
      sell_price: Number(sellPrice),
      image_url: (bulkRowsState[rowIndex] && bulkRowsState[rowIndex].imageUrl) || undefined,
    });
  });

  if (hasInvalid) {
    showToast("กรุณากรอกชื่อสินค้า/ต้นทุน/ราคาขายให้ครบทุกแถว");
    return;
  }

  const submitBtn = document.getElementById("submitBulkBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "กำลังบันทึก...";

  // เชื่อมกับ POST /api/items/bulk (src/modules/items/items.routes.ts)
  const { error } = await api.items.bulkCreate(lotId, items);

  submitBtn.disabled = false;
  submitBtn.textContent = "บันทึกทั้งหมด";

  if (error) {
    console.error(error);
    showToast("บันทึกไม่สำเร็จ: " + error.message);
    return;
  }

  showToast(`เพิ่มสินค้า ${items.length} ชิ้นเข้าสต็อกเรียบร้อย`);

  // เคลียร์ทุกแถว แล้วเริ่มแถวใหม่ 1 แถวว่างๆ ให้พร้อมกรอกชุดถัดไปทันที
  // (เหมาะกับสถานการณ์ทยอยแยกเสื้อจากกระสอบทีละล็อตย่อย ไม่ต้องสลับโหมดไปมา)
  document.getElementById("bulkRows").innerHTML = "";
  Object.keys(bulkRowsState).forEach((k) => delete bulkRowsState[k]);
  addBulkRow();

  loadItems();
});
