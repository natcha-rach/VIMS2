// ==========================================================
// nav.js — ควบคุมเมนู sidebar
// จอแคบ (<860px): เมนูอยู่เป็นแถบด้านล่างจอเสมอ (bottom nav bar)
// จอกว้าง (>=860px): เมนูอยู่ถาวรข้างซ้ายเสมอ กดย่อเหลือไอคอนได้
// โหลดในทุกหน้า ทำงานทันทีตอนโหลดสคริปต์ (ไม่ต้องรอ DOMContentLoaded
// เพราะ script อยู่ท้าย body องค์ประกอบ DOM พร้อมแล้ว)
// ==========================================================
(function () {
  const sidebar = document.getElementById("sidebar");
  const collapseBtn = document.getElementById("navCollapse");

  if (!sidebar) return; // กันพลาดกรณีหน้าไหนไม่มี sidebar

  function applyCollapsedState(collapsed) {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }

  // โหลดสถานะย่อเมนู (มีผลเฉพาะจอกว้าง)
  const savedCollapsed = localStorage.getItem("shirtShopSidebarCollapsed") === "true";
  applyCollapsedState(savedCollapsed);

  collapseBtn?.addEventListener("click", () => {
    const collapsed = !document.body.classList.contains("sidebar-collapsed");
    localStorage.setItem("shirtShopSidebarCollapsed", collapsed);
    applyCollapsedState(collapsed);
  });

  // ไฮไลต์เมนูของหน้าปัจจุบัน
  const currentPage = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".sidebar-links a").forEach((a) => {
    if (a.getAttribute("href") === currentPage) a.classList.add("active");
  });

  // ==========================================================
  // ปุ่ม Logout
  // ==========================================================
  //
  // เพิ่มเข้ามาใหม่ตอนทำระบบ login (apiClient.js) — เดิม (Supabase-direct)
  // ไม่มี login เลยไม่เคยต้องมีปุ่มนี้มาก่อน
  //
  // สร้างด้วย JS แทนการแก้ทุกไฟล์ .html เพราะ sidebar-links มีโครงสร้างเดียวกัน
  // ทุกหน้าอยู่แล้ว เพิ่มที่นี่ที่เดียวพอ ใช้ได้ทุกหน้าโดยอัตโนมัติ
  const linksContainer = document.querySelector(".sidebar-links");
  if (linksContainer) {
    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.title = "ออกจากระบบ";
    logoutLink.innerHTML = `<span class="icon">🚪</span><span class="label">ออกจากระบบ</span>`;
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      // api มาจาก apiClient.js ซึ่งต้องโหลดก่อน nav.js เสมอ (ดู <script> ในแต่ละหน้า .html)
      api.auth.logout();
    });
    linksContainer.appendChild(logoutLink);
  }
})();
