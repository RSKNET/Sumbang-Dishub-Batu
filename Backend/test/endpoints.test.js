const test = require("node:test");
const assert = require("node:assert");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 1. Setup Env Variables
process.env.JWT_SECRET = "test-secret-key-123456";
process.env.REFRESH_SECRET = "test-refresh-secret-key-123456";

// 2. Setup Supabase Mock via require.cache
let mockDataMap = {};
let mockErrorMap = {};

class SupabaseMockBuilder {
  constructor(table) {
    this.table = table;
  }
  from(table) { this.table = table; return this; }
  select(query) { return this; }
  eq(field, value) { return this; }
  order(field, opts) { return this; }
  single() { return this; }
  insert(arr) { return this; }
  update(obj) { return this; }
  delete() { return this; }
  then(onFulfilled) {
    const data = typeof mockDataMap[this.table] === "function"
      ? mockDataMap[this.table]()
      : mockDataMap[this.table];
    const error = typeof mockErrorMap[this.table] === "function"
      ? mockErrorMap[this.table]()
      : mockErrorMap[this.table];
    return Promise.resolve({ data, error }).then(onFulfilled);
  }
}

const supabaseMock = {
  from: (table) => new SupabaseMockBuilder(table),
  storage: {
    from: (bucket) => ({
      list: () => Promise.resolve({ data: [{ name: "req-123.pdf" }, { name: "req-123.webp" }], error: null }),
      createSignedUrl: () => Promise.resolve({ data: { signedUrl: "http://mock-url" }, error: null })
    })
  }
};

require.cache[require.resolve("../src/utils/supabase")] = {
  exports: supabaseMock
};

// 3. Import Controllers
const adminController = require("../src/controllers/Admin");
const publicController = require("../src/controllers/Public");
const usersController = require("../src/controllers/Users");

// 4. Create Express test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/auth", adminController);
app.use("/public", publicController);
app.use("/users", usersController);

let server;
let baseUrl;

test.before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(() => {
  return new Promise((resolve) => {
    server.close(resolve);
  });
});

// Setup helpers
const createSuperAdminToken = () => {
  return jwt.sign({ id: "admin-id", role: "superadmin-role-id" }, process.env.JWT_SECRET);
};

const createUserToken = () => {
  return jwt.sign({ id: "user-id", role: "user-role-id" }, process.env.JWT_SECRET);
};

// ==========================================
// 1. Group: /auth (Admin Actions)
// ==========================================

test("POST /auth/register - success", async () => {
  mockDataMap = {
    role: { id: "superadmin-role-id" },
    users: [{ id: "new-admin-id" }]
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "superadmin", password: "password123" })
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.message, "SuperAdmin berhasil didaftarkan!");
});

test("POST /auth/add-users - success", async () => {
  const token = createSuperAdminToken();
  mockDataMap = {
    role: { id: "superadmin-role-id" }, // both for middleware and validate exists check
    users: []
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/auth/add-users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ username: "newuser", password: "password123", role_id: "superadmin-role-id" })
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.message, "User berhasil ditambahkan!");
});

test("PUT /auth/update/:id - success", async () => {
  const token = createSuperAdminToken();
  mockDataMap = {
    role: { id: "superadmin-role-id" },
    users: []
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/auth/update/user-123`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ newUsername: "updatedname" })
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.message, "Data berhasil diperbarui!");
});

test("DELETE /auth/delete-user/:id - success", async () => {
  const token = createSuperAdminToken();
  mockDataMap = {
    role: { id: "superadmin-role-id" },
    users: { id: "target-user-id" }
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/auth/delete-user/target-user-id`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.message, "User berhasil dihapus!");
});

test("GET /auth/list-users - success", async () => {
  const token = createSuperAdminToken();
  mockDataMap = {
    role: { id: "superadmin-role-id" },
    users: [{ id: "user-1", username: "user1", role: "role-1" }]
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/auth/list-users`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.users.length, 1);
});

// ==========================================
// 2. Group: /public (Public Actions)
// ==========================================

test("POST /public/add-request - success", async () => {
  mockDataMap = {
    requests: [
      {
        id: "req-123",
        nama: "Budi",
        alamat: "Batu",
        no_whatsapp: "081234",
        no_hp: "081234",
        permintaan: { name: "PJU" },
        detail_permintaan: "mati",
        lokasi: "Jl. Gajah",
        surat: null,
        foto: null,
        status: { name: "Pending" },
        date: "12:00, 14-07-2026"
      }
    ]
  };
  mockErrorMap = {};

  const formData = new FormData();
  formData.append("nama", "Budi");
  formData.append("alamat", "Batu");
  formData.append("permintaan", "1");
  formData.append("lokasi", "Jl. Gajah");

  const res = await fetch(`${baseUrl}/public/add-request`, {
    method: "POST",
    body: formData
  });

  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.message, "Data berhasil ditambahkan!");
});

test("GET /public/public-status - success", async () => {
  mockDataMap = {
    requests: [
      {
        nama: "Ahmad",
        lokasi: "Batu",
        date: "2026-07-14",
        permintaan: { name: "Perbaikan Jalan" },
        status: { name: "Diproses" }
      }
    ]
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/public/public-status`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.data[0].nama, "Ahmad");
});

// ==========================================
// 3. Group: /users (User Actions)
// ==========================================

test("POST /users/login - success", async () => {
  const hash = bcrypt.hashSync("password123", 10);
  mockDataMap = {
    users: {
      id: "user-123",
      username: "user1",
      password: hash,
      role: "role-123"
    }
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user1", password: "password123" })
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.ok(body.accessToken);
});

test("POST /users/logout - success", async () => {
  mockDataMap = { users: [] };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/users/logout`, {
    method: "POST"
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.message, "Logout berhasil!");
});

test("GET /users/role - success", async () => {
  const refreshToken = jwt.sign({ id: "user-123", role: "role-123" }, process.env.REFRESH_SECRET);
  const res = await fetch(`${baseUrl}/users/role`, {
    headers: {
      Cookie: `refreshToken=${refreshToken}`
    }
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.role, "role-123");
});

test("POST /users/refresh - success", async () => {
  const refreshToken = jwt.sign({ id: "user-123", role: "role-123" }, process.env.REFRESH_SECRET);
  mockDataMap = {
    users: {
      id: "user-123",
      role: "role-123",
      refresh_token: refreshToken
    }
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/users/refresh`, {
    method: "POST",
    headers: {
      Cookie: `refreshToken=${refreshToken}`
    }
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.ok(body.accessToken);
});

test("GET /users/users-dashboard - success", async () => {
  const token = createUserToken();
  mockDataMap = {
    requests: [
      { id: "req-1", nama: "Adit", no_hp: "123", lokasi: "Batu", date: "2026-07-14" }
    ]
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/users/users-dashboard`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.data[0].nama, "Adit");
});

test("GET /users/detail/:id - success", async () => {
  const token = createUserToken();
  mockDataMap = {
    requests: {
      id: "req-123",
      nama: "Budi",
      alamat: "Batu",
      no_whatsapp: "123",
      no_hp: "123",
      lokasi: "Batu",
      detail_permintaan: "jalan rusak",
      date: "2026-07-14",
      permintaan: { name: "Jalan" },
      status: { name: "Diproses" },
      surat: "req-123.pdf",
      foto: "req-123.webp"
    }
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/users/detail/req-123`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.data.nama, "Budi");
  assert.strictEqual(body.data.surat, "http://mock-url");
});

test("PATCH /users/edit-status/:id - success", async () => {
  const token = createUserToken();
  mockDataMap = {
    requests: { id: "req-123" },
    status: { id: "status-2" }
  };
  mockErrorMap = {};

  const res = await fetch(`${baseUrl}/users/edit-status/req-123`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ status_id: "status-2" })
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.message, "Status berhasil diperbarui!");
});
