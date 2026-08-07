// ==========================================================
// dashboard.js — หน้าแรก "สรุปภาพรวม"
// ==========================================================

async function loadDashboard() {
  // เดิม: ยิง 3 คำสั่งแยกไปที่ Supabase ตรงๆ (lots, items, sales)
  // ใหม่: ยิงไปที่ backend API ของเราแทน (endpoint คนละตัวกัน ดึงมาคำนวณฝั่งเว็บเหมือนเดิม)
  //   GET /api/lots   -> lots.repository.ts
  //   GET /api/items  -> items.repository.ts
  //   GET /api/sales  -> sales.repository.ts
  const { data: lots, error: lotsErr } = await api.lots.list();
  const { data: items, error: itemsErr } = await api.items.list("all");
  const { data: sales, error: salesErr } = await api.sales.list();

  if (lotsErr || itemsErr || salesErr) {
    console.error(lotsErr || itemsErr || salesErr);
    showToast("โหลดข้อมูลไม่สำเร็จ ตรวจสอบว่า backend เปิดอยู่หรือไม่");
    return;
  }

  // เงินทุนรวม = ผลรวมต้นทุนทุกล็อต
  const totalCapital = lots.reduce((sum, l) => sum + Number(l.total_cost || 0), 0);

  // ยอดขายรวม / ต้นทุนของที่ขายไปแล้ว / กำไรสุทธิ
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.sale_price || 0), 0);
  const totalCostSold = sales.reduce((sum, s) => sum + Number(s.cost_price || 0), 0);
  const netProfit = totalRevenue - totalCostSold;

  // สต็อกคงเหลือ
  const inStockItems = items.filter((i) => i.status === "in_stock");
  const stockValue = inStockItems.reduce((sum, i) => sum + Number(i.cost_price || 0), 0);

  document.getElementById("statCapital").textContent = formatBaht(totalCapital);
  document.getElementById("statRevenue").textContent = formatBaht(totalRevenue);

  const profitEl = document.getElementById("statProfit");
  profitEl.textContent = formatBaht(netProfit);
  profitEl.classList.add(netProfit >= 0 ? "profit" : "loss");

  document.getElementById("statStockValue").textContent = formatBaht(stockValue);
  document.getElementById("stockCount").textContent =
    `เหลือ ${inStockItems.length} ชิ้น จากทั้งหมด ${items.length} ชิ้น`;

  // แยกยอดตามวิธีจ่ายเงิน
  // s.payment_method เป็นตัวพิมพ์เล็กแล้ว (apiClient.js แปลงให้อัตโนมัติ ดู lowercaseEnumValues)
  const byPayment = {};
  sales.forEach((s) => {
    if (!byPayment[s.payment_method]) byPayment[s.payment_method] = { count: 0, total: 0 };
    byPayment[s.payment_method].count += 1;
    byPayment[s.payment_method].total += Number(s.sale_price || 0);
  });
  const paymentRows = Object.keys(byPayment).length
    ? Object.entries(byPayment)
        .map(
          ([method, v]) =>
            `<tr><td>${PAYMENT_LABELS[method] || method}</td><td style="text-align:right">${v.count}</td><td style="text-align:right">${formatBaht(v.total)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="3" class="empty-state">ยังไม่มีรายการขาย</td></tr>`;
  document.getElementById("paymentBreakdown").innerHTML = paymentRows;

  // กำไรแยกตามล็อต
  // s.item_id ยังใช้ได้ตรงๆ เหมือนเดิม เพราะ Sale ของ backend มี field itemId (FK) อยู่จริง
  // (แยกจาก s.item ซึ่งเป็นข้อมูลสินค้าที่แนบมาให้ดูเฉยๆ ไม่ได้ใช้ในหน้านี้)
  const itemById = Object.fromEntries(items.map((i) => [i.id, i]));
  const lotStats = {};
  sales.forEach((s) => {
    const item = itemById[s.item_id];
    const lotId = item ? item.lot_id : null;
    if (!lotStats[lotId]) lotStats[lotId] = { count: 0, profit: 0 };
    lotStats[lotId].count += 1;
    lotStats[lotId].profit += Number(s.sale_price || 0) - Number(s.cost_price || 0);
  });
  const lotById = Object.fromEntries(lots.map((l) => [l.id, l]));
  const lotRows = Object.keys(lotStats).length
    ? Object.entries(lotStats)
        .map(([lotId, v]) => {
          const lotName = lotById[lotId] ? lotById[lotId].lot_name : "(ไม่ระบุล็อต)";
          const profitClass = v.profit >= 0 ? "profit" : "loss";
          return `<tr><td>${lotName}</td><td style="text-align:right">${v.count}</td><td style="text-align:right" class="${profitClass}">${formatBaht(v.profit)}</td></tr>`;
        })
        .join("")
    : `<tr><td colspan="3" class="empty-state">ยังไม่มีรายการขาย</td></tr>`;
  document.getElementById("lotBreakdown").innerHTML = lotRows;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

loadDashboard();
