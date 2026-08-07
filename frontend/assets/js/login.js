// ==========================================================
// login.js
// ==========================================================
//
// ควบคุมฟอร์ม login หน้าเดียว (login.html)
// เชื่อมกับ api.auth.login() ใน apiClient.js ซึ่งไปเรียก
// POST /api/auth/login ที่ backend (src/modules/auth/auth.routes.ts)
//

// ถ้ามี token อยู่แล้ว (login ค้างไว้) ไม่ต้องให้เห็นฟอร์ม login อีก เด้งเข้าหน้าแรกเลย
// (ฟังก์ชัน isLoggedIn() มาจาก apiClient.js ที่โหลดมาก่อนไฟล์นี้)
if (api.auth.isLoggedIn()) {
  location.href = "index.html";
}

// ดักการ submit ฟอร์ม (กันไม่ให้ browser reload หน้าแบบ default ตอนกด submit)
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("loginError");
  const submitBtn = document.getElementById("loginSubmitBtn");

  // ซ่อน error เดิม (ถ้ามีจากรอบก่อน) ก่อนลองใหม่
  errorBox.classList.remove("show");

  // ปิดปุ่มชั่วคราวกันคนกดซ้ำหลายทีระหว่างรอ response
  submitBtn.disabled = true;
  submitBtn.textContent = "กำลังเข้าสู่ระบบ...";

  // เรียก apiClient -> POST /api/auth/login
  const { error } = await api.auth.login(email, password);

  submitBtn.disabled = false;
  submitBtn.textContent = "เข้าสู่ระบบ";

  if (error) {
    // แสดงข้อความ error ที่ backend ส่งกลับมา (เช่น "Invalid credentials")
    errorBox.textContent = error.message;
    errorBox.classList.add("show");
    return;
  }

  // login สำเร็จ -> apiClient เก็บ token ให้เรียบร้อยแล้ว พาไปหน้าแรกของระบบ
  location.href = "index.html";
});
