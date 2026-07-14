const test = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");

// Set environment variables before requiring the middleware
process.env.JWT_SECRET = "test-secret-key-123456";
process.env.REFRESH_SECRET = "test-refresh-secret-key-123456";

const authMiddleware = require("../src/middlewares/authMiddleware");

test("authMiddleware - missing auth header", async (t) => {
  const req = { headers: {} };
  let statusResult;
  let jsonResult;
  const res = {
    status(code) {
      statusResult = code;
      return this;
    },
    json(data) {
      jsonResult = data;
      return this;
    }
  };
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await authMiddleware(req, res, next);

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusResult, 401);
  assert.strictEqual(jsonResult.success, false);
  assert.strictEqual(jsonResult.message, "Unauthorized");
});

test("authMiddleware - invalid format auth header", async (t) => {
  const req = {
    headers: {
      authorization: "Bearer"
    }
  };
  let statusResult;
  let jsonResult;
  const res = {
    status(code) {
      statusResult = code;
      return this;
    },
    json(data) {
      jsonResult = data;
      return this;
    }
  };
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await authMiddleware(req, res, next);

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusResult, 401);
  assert.strictEqual(jsonResult.success, false);
  assert.strictEqual(jsonResult.message, "Unauthorized");
});

test("authMiddleware - valid token", async (t) => {
  const payload = { id: "test-user-id", role: "admin" };
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  const req = {
    headers: {
      authorization: `Bearer ${token}`
    }
  };
  const res = {};
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await authMiddleware(req, res, next);

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.user.id, "test-user-id");
  assert.strictEqual(req.user.role, "admin");
});

test("supabase client - instance created", () => {
  const supabase = require("../src/utils/supabase");
  assert.ok(supabase);
  assert.strictEqual(typeof supabase.from, "function");
  assert.strictEqual(typeof supabase.auth, "object");
});
