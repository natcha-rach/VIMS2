// ==========================================================
// lots.js — จัดการหน้า "รับของเข้า / ล็อต"
// ==========================================================
//
// แก้ไขจากไฟล์เดิม (ที่คุย Supabase ตรงๆ) ให้เรียกผ่าน apiClient.js แทน
// จุดที่เปลี่ยนมีแค่ "วิธีเรียกข้อมูล" (supabaseClient.from(...) -> api.lots.xxx(...))
// ส่วน logic ของหน้า (validate, edit mode, render list) เหมือนเดิมทุกอย่าง
// เพราะ apiClient.js คืนค่ารูปแบบ { data, error } เหมือน Supabase เดิมไว้ให้แล้ว
//

let editingLotId = null;
let lotsCache = [];
let pendingLotImageUrl = null;

document.getElementById("purchaseDate").valueAsDate = new Date();

// ==========================================================
// อัปโหลดรูปกระสอบ/ล็อต (เชื่อมกับ api.uploadImage() ใน apiClient.js -> Cloudinary)
// ==========================================================
document.getElementById("lotImageFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const preview = document.getElementById("lotImagePreview");
  const statusEl = document.getElementById("lotImageStatus");

  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
  statusEl.textContent = "กำลังอัปโหลด...";
  pendingLotImageUrl = null;

  const { url, error } = await api.uploadImage(file);
  if (error) {
    statusEl.textContent = "อัปโหลดไม่สำเร็จ: " + error.message;
    return;
  }
  pendingLotImageUrl = url;
  statusEl.textContent = "อัปโหลดสำเร็จ";
});

function resetLotImageField() {
  pendingLotImageUrl = null;
  const preview = document.getElementById("lotImagePreview");
  preview.src = "";
  preview.style.display = "none";
  document.getElementById("lotImageStatus").textContent = "";
  document.getElementById("lotImageFile").value = "";
}

document.getElementById("lotForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // payload ยังใช้ชื่อ field แบบ snake_case เหมือนเดิม
  // apiClient.js จะแปลงเป็น camelCase ให้อัตโนมัติก่อนส่งไป backend จริง
  const payload = {
    lot_name: document.getElementById("lotName").value.trim(),
    purchase_date: document.getElementById("purchaseDate").value,
    source: document.getElementById("source").value.trim(),
    total_cost: Number(document.getElementById("totalCost").value),
    total_items: Number(document.getElementById("totalItems").value),
    note: document.getElementById("note").value.trim(),
    image_url: pendingLotImageUrl || undefined,
  };

  if (editingLotId) {
    // เดิม: supabaseClient.from("lots").update(payload).eq("id", editingLotId)
    // ใหม่: เชื่อมกับ PATCH /api/lots/:id (src/modules/lots/lots.routes.ts)
    const { error } = await api.lots.update(editingLotId, payload);
    if (error) {
      console.error(error);
      showToast("บันทึกไม่สำเร็จ: " + error.message);
      return;
    }
    showToast("แก้ไขล็อตเรียบร้อย");
    exitEditMode();
  } else {
    // เดิม: supabaseClient.from("lots").insert(payload)
    // ใหม่: เชื่อมกับ POST /api/lots
    const { error } = await api.lots.create(payload);
    if (error) {
      console.error(error);
      showToast("บันทึกไม่สำเร็จ: " + error.message);
      return;
    }
    showToast("บันทึกล็อตเรียบร้อย");
    document.getElementById("lotForm").reset();
    document.getElementById("purchaseDate").valueAsDate = new Date();
    resetLotImageField();
  }

  loadLots();
});

document.getElementById("cancelLotEdit").addEventListener("click", exitEditMode);

function exitEditMode() {
  editingLotId = null;
  document.getElementById("lotForm").reset();
  document.getElementById("purchaseDate").valueAsDate = new Date();
  document.getElementById("lotSubmitBtn").textContent = "บันทึกล็อต";
  document.getElementById("cancelLotEdit").classList.add("hidden");
  resetLotImageField();
}

function enterEditMode(lot) {
  editingLotId = lot.id;
  document.getElementById("lotName").value = lot.lot_name || "";
  document.getElementById("purchaseDate").value = lot.purchase_date;
  document.getElementById("source").value = lot.source || "";
  document.getElementById("totalCost").value = lot.total_cost;
  document.getElementById("totalItems").value = lot.total_items;
  document.getElementById("note").value = lot.note || "";
  document.getElementById("lotSubmitBtn").textContent = "บันทึกการแก้ไข";
  document.getElementById("cancelLotEdit").classList.remove("hidden");

  resetLotImageField();
  if (lot.image_url) {
    pendingLotImageUrl = lot.image_url;
    const preview = document.getElementById("lotImagePreview");
    preview.src = lot.image_url;
    preview.style.display = "block";
    document.getElementById("lotImageStatus").textContent = "ใช้รูปเดิม (เลือกไฟล์ใหม่เพื่อเปลี่ยน)";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadLots() {
  // เดิม: supabaseClient.from("lots").select("*").order("purchase_date", {ascending:false})
  // ใหม่: เชื่อมกับ GET /api/lots
  // (การเรียงลำดับล่าสุดก่อน ทำที่ backend แล้ว — ดู lots.repository.ts: orderBy purchaseDate desc)
  const { data: lots, error } = await api.lots.list();

  if (error) {
    console.error(error);
    document.getElementById("lotList").innerHTML = `<div class="empty-state">โหลดข้อมูลไม่สำเร็จ</div>`;
    return;
  }

  lotsCache = lots;

  if (!lots.length) {
    document.getElementById("lotList").innerHTML = `<div class="empty-state">ยังไม่มีล็อต เพิ่มล็อตแรกด้านบนได้เลย</div>`;
    return;
  }

  const html = lots
    .map((lot) => {
      const avgCost = lot.total_items > 0 ? lot.total_cost / lot.total_items : 0;
      return `
      <div class="tag-card">
        <div class="lot-row">
          <div>
            <div class="lot-name">${lot.lot_name}</div>
            <div class="lot-meta">${formatDate(lot.purchase_date)}${lot.source ? " · " + lot.source : ""}</div>
          </div>
          <div class="lot-summary">
            <div class="lot-cost">${formatBaht(lot.total_cost)}</div>
            <div class="lot-meta">${lot.total_items} ชิ้น · เฉลี่ย ${formatBaht(avgCost)}/ชิ้น</div>
          </div>
          ${lot.note ? `<div class="lot-note">${lot.note}</div>` : ""}
        </div>
        <div class="item-actions">
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${lot.id}">แก้ไข</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${lot.id}">ลบ</button>
        </div>
      </div>`;
    })
    .join("");

  document.getElementById("lotList").innerHTML = html;

  document.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const lot = lotsCache.find((l) => l.id === btn.dataset.id);
      if (lot) enterEditMode(lot);
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.id));
  });
}

async function handleDelete(lotId) {
  const lot = lotsCache.find((l) => l.id === lotId);
  const ok = confirm(
    `ลบล็อต "${lot ? lot.lot_name : ""}" ใช่ไหม?\n(สินค้าที่เคยอยู่ในล็อตนี้จะยังอยู่ในระบบ แต่จะไม่ผูกกับล็อตนี้อีก)`
  );
  if (!ok) return;

  // เดิม: supabaseClient.from("lots").delete().eq("id", lotId)
  // ใหม่: เชื่อมกับ DELETE /api/lots/:id
  // หมายเหตุ: backend เวอร์ชันใหม่ป้องกันการลบล็อตที่ยังมีสินค้าติดอยู่ (ต่างจาก Supabase เดิม
  // ที่ปล่อยให้ลบได้เสมอ) ถ้าลบไม่ผ่าน error.message จะบอกเหตุผลชัดเจนจาก backend
  const { error } = await api.lots.delete(lotId);
  if (error) {
    console.error(error);
    showToast("ลบไม่สำเร็จ: " + error.message);
    return;
  }
  showToast("ลบล็อตเรียบร้อย");
  if (editingLotId === lotId) exitEditMode();
  loadLots();
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

loadLots();
