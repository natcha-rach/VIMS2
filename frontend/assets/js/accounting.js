// ==========================================================
// accounting.js — หน้าบัญชี: ค่าใช้จ่าย, สรุปกำไร/ขาดทุน, ถังเงิน, สมุดบัญชี
// ==========================================================

let editingExpenseId = null;
let expensesCache = [];
let baseAmountTouched = false;

document.getElementById("expenseDate").valueAsDate = new Date();

/* ---------- ระบบแบ่งถังเงิน ---------- */
const pctInputs = {
  cost: document.getElementById("pctCost"),
  debt: document.getElementById("pctDebt"),
  reserve: document.getElementById("pctReserve"),
  other: document.getElementById("pctOther"),
};
const bucketBaseAmountEl = document.getElementById("bucketBaseAmount");

// ผูก key ของฟอร์มหน้านี้ (cost/debt/reserve/other) เข้ากับ key ที่ backend เก็บจริง
// (backend เก็บเป็น array ของ {key, label, percent} ไม่ใช่ object แบน {cost, debt, ...} แบบเดิม
//  เพราะออกแบบให้เพิ่ม/ลดจำนวนถังได้ในอนาคต แต่หน้านี้ยังตรึงไว้ที่ 4 ถังเท่าเดิมก่อน)
const BUCKET_KEY_MAP = {
  cost: { key: "cost_reserve", label: "เก็บต้นทุน" },
  debt: { key: "debt_payment", label: "ใช้หนี้รายเดือน" },
  reserve: { key: "reserve", label: "สำรอง" },
  other: { key: "other_expense", label: "ค่าใช้จ่ายอื่น" },
};

async function loadBucketSettings() {
  // เดิม: supabaseClient.from("app_settings").select("*").eq("key","bucket_split").maybeSingle()
  // ใหม่: เชื่อมกับ GET /api/settings/money-buckets (src/modules/settings/settings.routes.ts)
  // backend คืนค่ามาเป็น { buckets: [{ key, label, percent }, ...] } เสมอ
  // (ถ้ายังไม่เคยตั้งค่าเลย จะได้ค่า default 40/20/20/20 กลับมาแทนที่จะเป็นค่าว่าง)
  const { data, error } = await api.settings.getMoneyBuckets();

  if (error) {
    console.error(error);
    return;
  }

  if (data && Array.isArray(data.buckets)) {
    // ไล่หา percent ของแต่ละถังตาม key แล้วเติมลงช่อง input ที่ตรงกัน
    for (const [formKey, mapping] of Object.entries(BUCKET_KEY_MAP)) {
      const bucket = data.buckets.find((b) => b.key === mapping.key);
      if (bucket) pctInputs[formKey].value = bucket.percent;
    }
  }
  recalcBuckets();
}

document.getElementById("bucketForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // แปลงจาก 4 ช่อง input ของฟอร์ม กลับไปเป็นรูปแบบ array {key,label,percent} ที่ backend ต้องการ
  const buckets = Object.entries(BUCKET_KEY_MAP).map(([formKey, mapping]) => ({
    key: mapping.key,
    label: mapping.label,
    percent: Number(pctInputs[formKey].value) || 0,
  }));

  // เดิม: supabaseClient.from("app_settings").upsert({key:"bucket_split", value, ...})
  // ใหม่: เชื่อมกับ PUT /api/settings/money-buckets
  // backend ตรวจเองว่ารวมกันต้อง = 100% พอดี ถ้าไม่ครบจะได้ error กลับมา (validate ด้วย Zod)
  // (เดิม Supabase ไม่ได้เช็คเรื่องนี้เลย ปล่อยให้บันทึกได้แม้รวมกันไม่ครบ 100)
  const { error } = await api.settings.updateMoneyBuckets(buckets);

  if (error) {
    console.error(error);
    showToast("บันทึกเปอร์เซ็นต์ไม่สำเร็จ: " + error.message);
    return;
  }
  showToast("บันทึกเปอร์เซ็นต์การแบ่งถังเงินเรียบร้อย ครั้งหน้าจะใช้ค่านี้ทันที");
});

function recalcBuckets() {
  // ฟังก์ชันนี้คำนวณ "ตัวอย่าง" ที่หน้าจอทันทีที่พิมพ์ ไม่ต้องรอ backend ตอบกลับ
  // (เร็วกว่า และ backend ก็มี endpoint POST /api/settings/money-buckets/calculate
  //  ให้เรียกได้เหมือนกันถ้าจะทำหน้าจออื่นในอนาคต เช่นแอปมือถือแยกต่างหาก)
  const pctCost = Number(pctInputs.cost.value) || 0;
  const pctDebt = Number(pctInputs.debt.value) || 0;
  const pctReserve = Number(pctInputs.reserve.value) || 0;
  const pctOther = Number(pctInputs.other.value) || 0;
  const total = pctCost + pctDebt + pctReserve + pctOther;

  const warningEl = document.getElementById("pctTotalWarning");
  document.getElementById("pctTotalValue").textContent = total;
  warningEl.classList.toggle("hidden", total === 100);

  const base = Number(bucketBaseAmountEl.value) || 0;

  document.getElementById("bucketCostAmount").textContent = formatBaht((base * pctCost) / 100);
  document.getElementById("bucketDebtAmount").textContent = formatBaht((base * pctDebt) / 100);
  document.getElementById("bucketReserveAmount").textContent = formatBaht((base * pctReserve) / 100);
  document.getElementById("bucketOtherAmount").textContent = formatBaht((base * pctOther) / 100);
}

Object.values(pctInputs).forEach((input) => input.addEventListener("input", recalcBuckets));
bucketBaseAmountEl.addEventListener("input", () => {
  baseAmountTouched = true;
  recalcBuckets();
});

/* ---------- ฟอร์มเพิ่ม/แก้ไขค่าใช้จ่าย ---------- */
document.getElementById("expenseForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    expense_date: document.getElementById("expenseDate").value,
    amount: Number(document.getElementById("expenseAmount").value),
    category: document.getElementById("expenseCategory").value.trim(),
    note: document.getElementById("expenseNote").value.trim(),
  };

  if (editingExpenseId) {
    // เดิม: supabaseClient.from("expenses").update(payload).eq("id", editingExpenseId)
    // ใหม่: เชื่อมกับ PATCH /api/expenses/:id
    const { error } = await api.expenses.update(editingExpenseId, payload);
    if (error) {
      console.error(error);
      showToast("บันทึกไม่สำเร็จ: " + error.message);
      return;
    }
    showToast("แก้ไขค่าใช้จ่ายเรียบร้อย");
    exitEditMode();
  } else {
    // เดิม: supabaseClient.from("expenses").insert(payload)
    // ใหม่: เชื่อมกับ POST /api/expenses
    const { error } = await api.expenses.create(payload);
    if (error) {
      console.error(error);
      showToast("บันทึกไม่สำเร็จ: " + error.message);
      return;
    }
    showToast("บันทึกค่าใช้จ่ายเรียบร้อย");
    document.getElementById("expenseForm").reset();
    document.getElementById("expenseDate").valueAsDate = new Date();
  }

  loadAll();
});

document.getElementById("cancelExpenseEdit").addEventListener("click", exitEditMode);

function exitEditMode() {
  editingExpenseId = null;
  document.getElementById("expenseForm").reset();
  document.getElementById("expenseDate").valueAsDate = new Date();
  document.getElementById("expenseSubmitBtn").textContent = "บันทึกค่าใช้จ่าย";
  document.getElementById("cancelExpenseEdit").classList.add("hidden");
}

function enterEditMode(expense) {
  editingExpenseId = expense.id;
  document.getElementById("expenseDate").value = expense.expense_date;
  document.getElementById("expenseAmount").value = expense.amount;
  document.getElementById("expenseCategory").value = expense.category || "";
  document.getElementById("expenseNote").value = expense.note || "";
  document.getElementById("expenseSubmitBtn").textContent = "บันทึกการแก้ไข";
  document.getElementById("cancelExpenseEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function handleDeleteExpense(id) {
  const ok = confirm("ลบรายการค่าใช้จ่ายนี้ใช่ไหม?");
  if (!ok) return;

  // เดิม: supabaseClient.from("expenses").delete().eq("id", id)
  // ใหม่: เชื่อมกับ DELETE /api/expenses/:id
  const { error } = await api.expenses.delete(id);
  if (error) {
    console.error(error);
    showToast("ลบไม่สำเร็จ: " + error.message);
    return;
  }
  showToast("ลบค่าใช้จ่ายเรียบร้อย");
  if (editingExpenseId === id) exitEditMode();
  loadAll();
}

function renderExpenseList() {
  if (!expensesCache.length) {
    document.getElementById("expenseList").innerHTML = `<div class="empty-state">ยังไม่มีรายการค่าใช้จ่าย</div>`;
    return;
  }

  const sorted = [...expensesCache].sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1));
  const html = sorted
    .map(
      (exp) => `
      <div class="tag-card expense-row">
        <div>
          <div class="expense-category">${exp.category}</div>
          <div class="expense-meta">${formatDate(exp.expense_date)}${exp.note ? " · " + exp.note : ""}</div>
        </div>
        <div class="expense-actions">
          <div class="expense-amount">${formatBaht(exp.amount)}</div>
          <div class="item-actions">
            <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${exp.id}">แก้ไข</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${exp.id}">ลบ</button>
          </div>
        </div>
      </div>`
    )
    .join("");

  document.getElementById("expenseList").innerHTML = html;

  document.querySelectorAll('#expenseList [data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const exp = expensesCache.find((x) => x.id === btn.dataset.id);
      if (exp) enterEditMode(exp);
    });
  });
  document.querySelectorAll('#expenseList [data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteExpense(btn.dataset.id));
  });
}

/* ---------- โหลดข้อมูลทั้งหมด + คำนวณสรุป + สมุดบัญชี ---------- */
let ledgerRowsForExport = [];

async function loadAll() {
  // เดิม: ยิง 3 คำสั่งไปที่ Supabase พร้อมกันด้วย Promise.all
  // ใหม่: ยิงไปที่ backend API ของเราแทน (คนละ endpoint กัน แต่ยิงพร้อมกันเหมือนเดิม)
  const [{ data: lots, error: lotsErr }, { data: expenses, error: expErr }, { data: sales, error: salesErr }] =
    await Promise.all([api.lots.list(), api.expenses.list(), api.sales.list()]);

  if (lotsErr || expErr || salesErr) {
    console.error(lotsErr || expErr || salesErr);
    showToast("โหลดข้อมูลไม่สำเร็จ");
    return;
  }

  expensesCache = expenses;
  renderExpenseList();

  const totalCapital = lots.reduce((sum, l) => sum + Number(l.total_cost || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.sale_price || 0), 0);
  const totalCostSold = sales.reduce((sum, s) => sum + Number(s.cost_price || 0), 0);

  const netProfit = totalRevenue - totalCostSold - totalExpenses;
  const cashflow = totalRevenue - totalCapital - totalExpenses;

  document.getElementById("accCapital").textContent = formatBaht(totalCapital);
  document.getElementById("accExpenses").textContent = formatBaht(totalExpenses);
  document.getElementById("accRevenue").textContent = formatBaht(totalRevenue);

  if (!baseAmountTouched) {
    bucketBaseAmountEl.value = totalRevenue.toFixed(2);
  }
  recalcBuckets();

  const netProfitEl = document.getElementById("accNetProfit");
  netProfitEl.textContent = formatBaht(netProfit);
  netProfitEl.classList.remove("profit", "loss");
  netProfitEl.classList.add(netProfit >= 0 ? "profit" : "loss");

  const cashflowEl = document.getElementById("accCashflow");
  cashflowEl.textContent = formatBaht(cashflow);
  cashflowEl.classList.remove("profit", "loss");
  cashflowEl.classList.add(cashflow >= 0 ? "profit" : "loss");

  renderLedger(lots, expenses, sales);
}

function renderLedger(lots, expenses, sales) {
  const events = [];

  lots.forEach((l) => {
    events.push({
      date: new Date(l.purchase_date),
      desc: `รับล็อต: ${l.lot_name}${l.source ? " (" + l.source + ")" : ""}`,
      in: 0,
      out: Number(l.total_cost || 0),
    });
  });

  expenses.forEach((e) => {
    events.push({
      date: new Date(e.expense_date),
      desc: `ค่าใช้จ่าย: ${e.category}${e.note ? " (" + e.note + ")" : ""}`,
      in: 0,
      out: Number(e.amount || 0),
    });
  });

  sales.forEach((s) => {
    // เดิม: s.items.item_name (relation ชื่อ "items" ตามชื่อตารางใน Supabase)
    // ใหม่: s.item.item_name (relation ชื่อ "item" ตามที่ตั้งไว้ใน schema.prisma ฝั่ง backend)
    const name = s.item ? s.item.item_name : "(ไม่พบชื่อสินค้า)";
    events.push({
      date: new Date(s.sale_date),
      desc: `ขาย: ${name} (${PAYMENT_LABELS[s.payment_method] || s.payment_method})`,
      in: Number(s.sale_price || 0),
      out: 0,
    });
  });

  // เรียงเก่า -> ใหม่ เพื่อคำนวณยอดคงเหลือสะสม
  events.sort((a, b) => a.date - b.date);
  let running = 0;
  events.forEach((ev) => {
    running += ev.in - ev.out;
    ev.balance = running;
  });

  ledgerRowsForExport = events;

  if (!events.length) {
    document.getElementById("ledgerBody").innerHTML = `<tr><td colspan="5" class="empty-state">ยังไม่มีรายการ</td></tr>`;
    return;
  }

  // แสดงใหม่ -> เก่า
  const html = [...events]
    .reverse()
    .map(
      (ev) => `
      <tr>
        <td>${formatDate(ev.date)}</td>
        <td>${ev.desc}</td>
        <td style="text-align:right">${ev.in ? formatBaht(ev.in) : "-"}</td>
        <td style="text-align:right">${ev.out ? formatBaht(ev.out) : "-"}</td>
        <td style="text-align:right">${formatBaht(ev.balance)}</td>
      </tr>`
    )
    .join("");

  document.getElementById("ledgerBody").innerHTML = html;
}

/* ---------- ส่งออก CSV ---------- */
document.getElementById("exportCsvBtn").addEventListener("click", () => {
  if (!ledgerRowsForExport.length) {
    showToast("ยังไม่มีข้อมูลให้ส่งออก");
    return;
  }

  const header = "วันที่,รายการ,เงินเข้า,เงินออก,คงเหลือสะสม";
  const rows = ledgerRowsForExport.map((ev) => {
    const dateStr = ev.date.toLocaleDateString("th-TH");
    const desc = `"${ev.desc.replace(/"/g, '""')}"`;
    return [dateStr, desc, ev.in.toFixed(2), ev.out.toFixed(2), ev.balance.toFixed(2)].join(",");
  });

  const csvContent = "\uFEFF" + [header, ...rows].join("\n"); // \uFEFF กัน Excel อ่านภาษาไทยเพี้ยน
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `บัญชีร้าน-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

loadAll();
loadBucketSettings();
