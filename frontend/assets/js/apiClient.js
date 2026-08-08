// ==========================================================
// apiClient.js
// ==========================================================
//
// ไฟล์นี้แทนที่ "supabaseClient.js" เดิมทั้งไฟล์
// เมื่อก่อนหน้านี้เว็บคุยกับ Supabase ตรงๆ (ฐานข้อมูลอยู่ที่ Supabase)
// ตอนนี้เว็บจะคุยกับ Backend API ของเราเอง (Node.js + Express + Prisma) แทน
//
// เหตุผลที่ยังคง "รูปแบบ" การใช้งานให้เหมือน Supabase เดิม
// (คืนค่าเป็น { data, error } เสมอ) เพราะ:
//   - ไฟล์ lots.js / items.js / sell.js / reports.js / accounting.js / dashboard.js
//     เขียนมาให้เรียกแบบ `const { data, error } = await ...` อยู่แล้ว
//   - ทำให้แก้ไฟล์เหล่านั้นน้อยที่สุด (แค่เปลี่ยนตัวที่เรียก ไม่ต้องเขียน
//     try/catch ใหม่ทั้งหมด) ลดความเสี่ยงที่จะพลาดจุดใดจุดหนึ่งไป
//
// โครงสร้างไฟล์นี้แบ่งเป็น 5 ส่วน:
//   1) ตั้งค่า URL ของ backend + จัดการ JWT token
//   2) ตัวแปลง snake_case <-> camelCase อัตโนมัติ (อธิบายเหตุผลด้านล่าง)
//   3) ฟังก์ชันกลาง request() ที่ทุก resource เรียกใช้ร่วมกัน
//   4) obj `api` ที่รวม method แยกตาม resource (lots, items, sales, ...)
//   5) helper แสดงผล/แปลงรูปแบบที่ supabaseClient.js เดิมเคยมี (ย้ายมาไว้ที่นี่)
//


// ==========================================================
// 1) ตั้งค่า Backend + จัดการ Token
// ==========================================================

// URL ของ backend API — ตอน dev รันที่เครื่องตัวเอง (npm run dev ที่โปรเจกต์ VIMS)
// เปลี่ยนเป็นโดเมนจริงตอน deploy production (เช่น https://api.myshirtshop.com/api)
//const API_BASE_URL = "https://vims2-api.onrender.com";
const API_BASE_URL = "https://vims2-api.onrender.com/api";

// ==========================================================
// ตั้งค่า Cloudinary (สำหรับอัปโหลดรูปภาพ)
// ==========================================================
//
// *** ต้องแก้ 2 ค่านี้เป็นของคุณเองก่อนใช้งานจริง ***
//
// วิธีหาค่า:
//   1. สมัครบัญชีฟรีที่ https://cloudinary.com
//   2. หน้า Dashboard จะโชว์ "Cloud name" ของคุณ (ก๊อปมาใส่ CLOUDINARY_CLOUD_NAME)
//   3. ไปที่ Settings > Upload > Upload presets > Add upload preset
//      ตั้ง Signing Mode เป็น "Unsigned" (สำคัญมาก — ถ้าเป็น Signed จะอัปโหลดจากเบราว์เซอร์
//      ตรงๆ แบบนี้ไม่ได้ ต้องมี backend เซ็นให้ ซึ่งเราตั้งใจไม่ทำ endpoint นั้นเพื่อความง่าย)
//      แล้วก๊อปชื่อ preset มาใส่ CLOUDINARY_UPLOAD_PRESET
//
// ทำไมอัปโหลดตรงจากเบราว์เซอร์ไป Cloudinary เลย ไม่ผ่าน backend ของเรา:
//   - backend ไม่ต้องแบกภาระรับไฟล์ภาพ (ซึ่งไฟล์ใหญ่กว่า JSON ทั่วไปมาก)
//   - Cloudinary จัดการบีบอัด/ย่อขนาดรูปให้อัตโนมัติอยู่แล้ว
//   - "unsigned upload preset" ถูกออกแบบมาให้ปลอดภัยสำหรับใช้ฝั่ง client โดยเฉพาะ
//     (จำกัดได้ว่าอัปโหลดได้แค่ folder ไหน ขนาดเท่าไหร่ ผ่านการตั้งค่าใน preset)
const CLOUDINARY_CLOUD_NAME = "ap7jso9z"; // TODO: แก้เป็น Cloud name จริงของคุณ
const CLOUDINARY_UPLOAD_PRESET = "project-vims2"; // TODO: แก้เป็นชื่อ unsigned preset จริงของคุณ

// key ที่ใช้เก็บ JWT token ใน localStorage ของเบราว์เซอร์
// (เก็บไว้ที่เครื่องผู้ใช้ ฝั่งเราไม่ต้องเก็บ session ใดๆ เพิ่ม)
const TOKEN_KEY = "shirtShopToken";

// อ่าน token ปัจจุบันจาก localStorage (ถ้ายังไม่เคย login จะได้ null)
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// บันทึก token หลัง login สำเร็จ
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

// ลบ token ตอน logout หรือตอน token หมดอายุ/ใช้ไม่ได้แล้ว
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ==========================================================
// Auth Guard — เช็คทุกหน้าที่โหลดสคริปต์นี้ (ยกเว้น login.html เอง)
// ==========================================================
//
// ทำงานทันทีตอนไฟล์นี้ถูกโหลด (ก่อน lots.js/items.js/... ที่มาทีหลังจะเริ่มยิง
// request ใดๆ) ถ้ายังไม่มี token เลย ให้เด้งไปหน้า login ทันที
// กันไม่ให้หน้าเว็บพยายามโหลดข้อมูลทั้งที่ยังไม่ได้ login (จะเจอ 401 รัว ๆ)
//
(function guardAuth() {
  const currentPage = location.pathname.split("/").pop() || "index.html";
  if (currentPage === "login.html") return; // หน้า login ไม่ต้องเช็ค (ไม่งั้นเข้าเว็บไม่ได้เลย)

  if (!getToken()) {
    location.href = "login.html";
  }
})();


// ==========================================================
// 2) ตัวแปลง snake_case <-> camelCase
// ==========================================================
//
// ทำไมต้องมีส่วนนี้:
//   - โค้ดหน้าเว็บเดิม (lots.js, items.js, ...) เขียนอ้างอิงชื่อ field แบบ
//     snake_case ตามชื่อคอลัมน์ของ Supabase/Postgres เช่น lot_name, cost_price
//   - แต่ Backend API ใหม่ (Prisma + TypeScript) ใช้ camelCase ตามธรรมเนียมของ
//     JavaScript/TypeScript เช่น lotName, costPrice
//   - แทนที่จะไปแก้ทุกจุดในทุกไฟล์ (เสี่ยงพลาด) ให้ apiClient.js นี้เป็นตัวกลาง
//     แปลงให้อัตโนมัติทุกครั้งที่ส่ง/รับข้อมูล:
//       - ส่งออกไปหา backend  -> แปลง snake_case เป็น camelCase ก่อน (toCamelDeep)
//       - รับข้อมูลกลับมา     -> แปลง camelCase เป็น snake_case ก่อนส่งต่อให้โค้ดหน้าเว็บ (toSnakeDeep)
//

// "lot_name" -> "lotName"
function toCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// "lotName" -> "lot_name"
function toSnake(key) {
  return key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}

// แปลง key ของ object/array แบบลึก (รองรับ object ซ้อน object เช่น sale.item.item_name)
// converter คือฟังก์ชัน toCamel หรือ toSnake ด้านบน ส่งเข้ามาใช้ร่วมกัน
function deepConvertKeys(value, converter) {
  if (Array.isArray(value)) {
    return value.map((v) => deepConvertKeys(v, converter));
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out = {};
    for (const key of Object.keys(value)) {
      out[converter(key)] = deepConvertKeys(value[key], converter);
    }
    return out;
  }
  // ค่าที่ไม่ใช่ object/array (string, number, boolean, null) คืนค่าเดิมตรงๆ
  return value;
}

const toCamelDeep = (v) => deepConvertKeys(v, toCamel);
const toSnakeDeep = (v) => deepConvertKeys(v, toSnake);

// ==========================================================
// แปลงค่า enum บางตัวให้เป็นตัวพิมพ์เล็ก (lower case)
// ==========================================================
//
// ตัวแปลง snake/camel ด้านบน แปลงแค่ "ชื่อ key" ไม่ได้แตะ "ค่า (value)" ข้างใน
// แต่ backend ใหม่เก็บค่าสถานะเป็นตัวพิมพ์ใหญ่ตาม enum ของ Prisma
// เช่น status: "IN_STOCK" | "SOLD", payment_method: "CASH" | "TRANSFER" | "GOVERNMENT"
//
// ในขณะที่ CSS class และเงื่อนไขเปรียบเทียบในโค้ดหน้าเว็บเดิม (เช่น
// `item.status === "in_stock"`, `class="badge ${item.status}"`,
// PAYMENT_LABELS[s.payment_method]) ใช้ตัวพิมพ์เล็กทั้งหมด
//
// ฟังก์ชันนี้จึงเจาะจงแปลงค่าของ 2 key นี้ให้เป็นตัวพิมพ์เล็กเสมอ หลังแปลง
// key เป็น snake_case แล้ว เพื่อให้โค้ดหน้าเว็บเดิมทำงานถูกต้องโดยไม่ต้องแก้
const ENUM_VALUE_KEYS = new Set(["status", "payment_method"]);

function lowercaseEnumValues(value) {
  if (Array.isArray(value)) {
    return value.map(lowercaseEnumValues);
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out = {};
    for (const key of Object.keys(value)) {
      const v = value[key];
      if (ENUM_VALUE_KEYS.has(key) && typeof v === "string") {
        out[key] = v.toLowerCase();
      } else {
        out[key] = lowercaseEnumValues(v);
      }
    }
    return out;
  }
  return value;
}


// ==========================================================
// 3) ฟังก์ชันกลาง: request()
// ==========================================================
//
// ทุก method ใน `api.*` ด้านล่าง สุดท้ายจะเรียกผ่านฟังก์ชันนี้ทั้งหมด
// เพื่อให้ logic เรื่อง header/token/แปลง case/จัดการ error อยู่ที่เดียว
//
// method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
// path:   path ต่อจาก API_BASE_URL เช่น "/lots", "/items/123"
// body:   object ที่จะส่งเป็น JSON body (ไม่ใส่ถ้าไม่มี เช่น method GET/DELETE)
//
async function request(method, path, body) {
  try {
    // เตรียม header: บอกว่าเป็น JSON เสมอ + แนบ JWT token ถ้ามี (ถ้าไม่มี = ยังไม่ login)
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // ยิง request จริงไปที่ backend
    // body ต้องแปลงเป็น camelCase ก่อน (ดูส่วนที่ 2) เพราะ backend คาดหวัง camelCase
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(toCamelDeep(body)) : undefined,
    });

    // 401 = token หมดอายุ หรือไม่ได้แนบ token มา -> เด้งกลับไป login ทันที
    if (res.status === 401) {
      clearToken();
      const currentPage = location.pathname.split("/").pop() || "index.html";
      if (currentPage !== "login.html") {
        location.href = "login.html";
      }
      return { data: null, error: { message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" } };
    }

    // parse JSON response (เผื่อ backend ล่มจน response ไม่ใช่ JSON เลย)
    const json = await res.json().catch(() => null);

    // backend เราตอบกลับเป็นรูปแบบ { success, message, data } เสมอ (ดู errorHandler.ts ฝั่ง backend)
    // ถ้า success เป็น false หรือ HTTP status ไม่ใช่ 2xx ให้ถือว่า error
    if (!res.ok || !json || json.success === false) {
      const message = (json && json.message) || `เกิดข้อผิดพลาด (HTTP ${res.status})`;
      return { data: null, error: { message } };
    }

    // สำเร็จ: แปลง key กลับเป็น snake_case + แปลงค่า enum เป็นตัวพิมพ์เล็ก
    // ก่อนส่งคืนให้โค้ดหน้าเว็บ (lots.js, items.js, ...) ใช้งานต่อ
    const data = lowercaseEnumValues(toSnakeDeep(json.data));
    return { data, error: null };
  } catch (err) {
    // เข้ามาตรงนี้ได้เมื่อ fetch ล้มเหลวจริงๆ เช่น backend ไม่ได้เปิดอยู่, ไม่มีเน็ต
    console.error("apiClient request failed:", err);
    return {
      data: null,
      error: { message: "เชื่อมต่อ backend ไม่ได้ ตรวจสอบว่าเซิร์ฟเวอร์เปิดอยู่หรือไม่ (" + API_BASE_URL + ")" },
    };
  }
}


// ==========================================================
// 4) api — รวม method แยกตาม resource
// ==========================================================
//
// แต่ละ resource (lots, items, sales, expenses, settings) มี method ให้เรียก
// ตรงกับ endpoint ฝั่ง backend แบบ 1 ต่อ 1 — คอมเมนต์แต่ละอันบอกว่าไปเชื่อมกับ
// endpoint ไหนที่ backend (ดูเทียบไฟล์ src/modules/<resource>/<resource>.routes.ts)
//
const api = {

  // --------------------------------------------------------
  // auth: login / logout
  // --------------------------------------------------------
  // เชื่อมกับ: POST /api/auth/login (src/modules/auth/auth.routes.ts)
  // --------------------------------------------------------
// auth: login / logout
// --------------------------------------------------------
// เชื่อมกับ: POST /api/auth/login
auth: {
  async login(username, password) {
    // Login เป็น public endpoint จึงไม่ผ่าน request() กลาง
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json || json.success === false) {
        return {
          error: {
            message:
              (json && json.message) ||
              "เข้าสู่ระบบไม่สำเร็จ",
          },
        };
      }

      // auth.service.ts คืนค่า:
      // { user, accessToken } ใน data
      const token =
        json.data && json.data.accessToken;

      if (!token) {
        return {
          error: {
            message:
              "ไม่พบ token ในคำตอบจากเซิร์ฟเวอร์",
          },
        };
      }

      setToken(token);

      return {
        error: null,
      };
    } catch (err) {
      return {
        error: {
          message:
            "เชื่อมต่อ backend ไม่ได้ ตรวจสอบว่าเซิร์ฟเวอร์เปิดอยู่หรือไม่",
        },
      };
    }
  },

  logout() {
    clearToken();
    location.href = "login.html";
  },

  isLoggedIn() {
    return !!getToken();
  },
},


  // --------------------------------------------------------
  // lots: รับของเข้า (1 ครั้ง = 1 กระสอบ/ล็อต)
  // --------------------------------------------------------
  // เชื่อมกับ: src/modules/lots/lots.routes.ts -> prefix /api/lots
  lots: {
    list: () => request("GET", "/lots"),               // GET  /api/lots        (ใช้ใน lots.js: loadLots)
    create: (payload) => request("POST", "/lots", payload),      // POST /api/lots        (เพิ่มล็อตใหม่)
    update: (id, payload) => request("PATCH", `/lots/${id}`, payload), // PATCH /api/lots/:id (แก้ไขล็อต)
    delete: (id) => request("DELETE", `/lots/${id}`),  // DELETE /api/lots/:id  (ลบล็อต)
  },


  // --------------------------------------------------------
  // items: สินค้าแต่ละชิ้นที่แยกออกจากล็อต
  // --------------------------------------------------------
  // เชื่อมกับ: src/modules/items/items.routes.ts -> prefix /api/items
  items: {
    // status: "all" | "in_stock" | "sold" (ใช้ตาม filterStatus ใน items.html)
    // ต้องแปลงเป็นตัวพิมพ์ใหญ่ก่อนส่ง เพราะ backend เก็บ enum เป็น IN_STOCK/SOLD
    list: (status) => {
      const qs = status && status !== "all" ? `?status=${status.toUpperCase()}` : "";
      return request("GET", `/items${qs}`); // GET /api/items?status=IN_STOCK
    },
    create: (payload) => request("POST", "/items", payload),        // POST /api/items (แยกสินค้า 1 ชิ้น)

    // แยกสินค้าหลายชิ้นพร้อมกันจากล็อตเดียว (ตอบโจทย์ "ซื้อกระสอบ 200 ตัว ทยอยแยกทีละ 2-3 ตัว")
    // เชื่อมกับ: POST /api/items/bulk
    bulkCreate: (lotId, items) => request("POST", "/items/bulk", { lot_id: lotId, items }),

    update: (id, payload) => request("PATCH", `/items/${id}`, payload), // PATCH /api/items/:id
    delete: (id) => request("DELETE", `/items/${id}`),                  // DELETE /api/items/:id

    // ขายสินค้า 1 ชิ้น — เชื่อมกับ POST /api/items/:id/sell (อยู่ใน items.routes.ts
    // แต่ logic จริงทำงานที่ sales module ฝั่ง backend)
    // payload ที่รับเข้ามาเป็น snake_case ตามที่ sell.js ส่งมา (sale_price, payment_method, ...)
    // ต้องแปลง payment_method เป็นตัวพิมพ์ใหญ่เอง เพราะค่านี้เป็น "ค่า" ไม่ใช่ "key"
    // (ตัวแปลง toCamelDeep ด้านบนแปลงแค่ชื่อ key ให้อัตโนมัติ ไม่แตะค่าข้างใน)
    sell: (id, payload) =>
      request("POST", `/items/${id}/sell`, {
        sale_price: payload.sale_price,
        payment_method: String(payload.payment_method || "").toUpperCase(),
        channel: payload.channel,
        note: payload.note,
      }),

    // ยกเลิกการขาย คืนสถานะเป็น in_stock — เชื่อมกับ POST /api/items/:id/cancel-sale
    cancelSale: (id) => request("POST", `/items/${id}/cancel-sale`),
  },


  // --------------------------------------------------------
  // sales: ดูรายการขาย (ใช้ในหน้า reports/accounting)
  // --------------------------------------------------------
  // เชื่อมกับ: GET /api/sales?from=&to=  (src/modules/sales/sales.routes.ts)
  sales: {
    list: (fromIso, toIso) => {
      const params = new URLSearchParams();
      if (fromIso) params.set("from", fromIso);
      if (toIso) params.set("to", toIso);
      const qs = params.toString();
      return request("GET", `/sales${qs ? "?" + qs : ""}`);
    },
  },


  // --------------------------------------------------------
  // expenses: ค่าใช้จ่ายอื่นๆ (ค่าเช่าแผง, ค่าเดินทาง ฯลฯ)
  // --------------------------------------------------------
  // เชื่อมกับ: src/modules/expenses/expenses.routes.ts -> prefix /api/expenses
  expenses: {
    list: () => request("GET", "/expenses"),
    create: (payload) => request("POST", "/expenses", payload),
    update: (id, payload) => request("PATCH", `/expenses/${id}`, payload),
    delete: (id) => request("DELETE", `/expenses/${id}`),
  },


  // --------------------------------------------------------
  // settings: ระบบแบ่งถังเงิน (money buckets)
  // --------------------------------------------------------
  // เชื่อมกับ: src/modules/settings/settings.routes.ts -> prefix /api/settings
  settings: {
    getMoneyBuckets: () => request("GET", "/settings/money-buckets"),
    // buckets: array ของ { key, label, percent } — ดู settings.types.ts ฝั่ง backend
    updateMoneyBuckets: (buckets) => request("PUT", "/settings/money-buckets", { buckets }),
    calculateMoneyBuckets: (amount) => request("POST", "/settings/money-buckets/calculate", { amount }),
  },


  // --------------------------------------------------------
  // uploadImage: อัปโหลดรูปภาพขึ้น Cloudinary โดยตรง (ไม่ผ่าน backend ของเรา)
  // --------------------------------------------------------
  //
  // ใช้กับฟิลด์ imageUrl ของทั้ง lots และ items
  // คืนค่า { url, error } — url คือลิงก์รูปที่ใช้ได้ทันที เอาไปใส่ payload.image_url ต่อได้เลย
  //
  // หมายเหตุ: ฟังก์ชันนี้ไม่ผ่าน request() กลางด้านบน เพราะปลายทางเป็น Cloudinary
  // ไม่ใช่ backend ของเรา (คนละ URL, คนละรูปแบบ response กันเลย)
  async uploadImage(file) {
    if (!file) return { url: null, error: null };

    if (CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
      // เตือนตั้งแต่เนิ่นๆ ถ้ายังไม่ได้แก้ค่า config ด้านบนของไฟล์นี้
      return {
        url: null,
        error: { message: "ยังไม่ได้ตั้งค่า Cloudinary (แก้ CLOUDINARY_CLOUD_NAME/CLOUDINARY_UPLOAD_PRESET ใน apiClient.js ก่อน)" },
      };
    }

    try {
      // Cloudinary รับไฟล์ผ่าน multipart/form-data (เหมือนฟอร์มอัปโหลดไฟล์ทั่วไป)
      // ไม่ใช่ JSON เหมือน request ปกติของเรา จึงต้องสร้าง FormData เอง
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const json = await res.json().catch(() => null);

      if (!res.ok || !json || !json.secure_url) {
        const message = (json && json.error && json.error.message) || "อัปโหลดรูปไม่สำเร็จ";
        return { url: null, error: { message } };
      }

      // secure_url คือ URL แบบ https ที่ใช้แสดงรูปได้ทันที (Cloudinary การันตีว่าเข้าถึงได้จากทุกที่)
      return { url: json.secure_url, error: null };
    } catch (err) {
      return {
        url: null,
        error: { message: "อัปโหลดรูปไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตหรือการตั้งค่า Cloudinary" },
      };
    }
  },
};


// ==========================================================
// 5) Helper แสดงผล (ย้ายมาจาก supabaseClient.js เดิม ไม่ได้แก้ logic)
// ==========================================================
//
// ไฟล์อื่นๆ (lots.js, items.js, ...) เรียกใช้ฟังก์ชันพวกนี้เป็น global function
// ตรงๆ (ไม่ผ่าน api.xxx) เหมือนเดิมทุกประการ จึงคงไว้เฉยๆ ไม่ย้ายไปไหน
//

// แปลง payment_method (english, ตัวพิมพ์เล็ก) <-> ป้ายภาษาไทยที่แสดงผล
const PAYMENT_LABELS = {
  cash: "เงินสด",
  transfer: "เงินโอน",
  government: "โครงการรัฐบาล",
};

// ฟอร์แมตตัวเลขเป็นสกุลเงินบาท เช่น 1234.5 -> "1,234.50 ฿"
function formatBaht(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ฿";
}

// ฟอร์แมตวันที่แบบไทยสั้นๆ เช่น "07 ส.ค. 2569"
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}
