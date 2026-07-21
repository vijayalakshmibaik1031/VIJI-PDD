const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

const BCRYPT_ROUNDS = 10;

// Configure Gmail Nodemailer transporter
const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4, // Force IPv4 to resolve ENETUNREACH on cloud environments
  auth: {
    user: "vijayalakshmibai0686@gmail.com",
    pass: "mvolzegmmjoqmzqw"
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Helper function to send email
async function sendVerificationEmail(userEmail, token) {
  const verificationLink = `https://viji-pdd-production-7c95.up.railway.app/api/verify-email?token=${token}`;
  const mailOptions = {
    from: `"FacilityVoice" <vijayalakshmibai0686@gmail.com>`,
    to: userEmail,
    subject: "Verify your FacilityVoice Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #334155;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to FacilityVoice!</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          Thank you for registering. Please click the button below to verify your email address and activate your account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 14px; color: #64748b;">
          If the button above does not work, copy and paste this link into your web browser:
        </p>
        <p style="font-size: 14px; word-break: break-all;">
          <a href="${verificationLink}" style="color: #4f46e5; text-decoration: underline;">${verificationLink}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `
  };
  console.log("=================================================");
  console.log(`[EMAIL SENDING TO: ${userEmail}]`);
  console.log(`Verification URL: ${verificationLink}`);
  console.log("=================================================");
  await mailTransporter.sendMail(mailOptions);
}

// Generate a secure random session token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Auth middleware — validates Bearer token against sessions table
async function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }
  const token = authHeader.slice(7);
  try {
    const result = await pool.query(
      "SELECT user_id, user_role FROM sessions WHERE token = $1",
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Unauthorized: invalid or expired token" });
    }
    req.user = { userId: result.rows[0].user_id, role: result.rows[0].user_role };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(500).json({ error: "Auth check failed" });
  }
}

const app = express();

function resolveEnvTemplate(value) {
  if (!value) return value;
  return value.replace(/\$\{\{([^}]+)\}\}/g, (_, key) => process.env[key] || "");
}

const databaseUrl = resolveEnvTemplate(process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL);
const poolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    }
  : {
      host: process.env.PGHOST || process.env.POSTGRES_HOST || "127.0.0.1",
      port: Number(process.env.PGPORT || process.env.POSTGRES_PORT || 5432),
      user: process.env.PGUSER || process.env.POSTGRES_USER,
      password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
      database: process.env.PGDATABASE || process.env.POSTGRES_DB,
      ssl:
        process.env.PGHOST && !/(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(process.env.PGHOST)
          ? { rejectUnauthorized: false }
          : false,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    };

// Middleware
app.use(cors());
app.use(express.json());

// Database Pool
const pool = new Pool(poolConfig);

// Seed manager and authority with hashed passwords (idempotent — safe to run every startup)
async function seedStaticAccounts() {
  const accounts = [
    { table: "managers",    id: "manager", name: "manager",    plainPassword: "man123", email: "manager@xyzcompany.com" },
    { table: "authorities", id: "auth",    name: "auth",       plainPassword: "auth123" },
    { table: "employees",   id: "emp001",  name: "Employee 1", plainPassword: "Test@123456", email: "employee1@xyzcompany.com" },
  ];

  for (const acc of accounts) {
    const existing = await pool.query(
      `SELECT id, password FROM ${acc.table} WHERE id = $1`, [acc.id]
    );

    if (existing.rows.length === 0) {
      // Insert fresh with hashed password
      const hash = await bcrypt.hash(acc.plainPassword, BCRYPT_ROUNDS);
      if (acc.table === "authorities") {
        await pool.query(
          `INSERT INTO authorities (id, name, password) VALUES ($1, $2, $3)`,
          [acc.id, acc.name, hash]
        );
      } else if (acc.table === "employees") {
        await pool.query(
          `INSERT INTO employees (id, name, password, email, is_verified, needs_password_reset) VALUES ($1, $2, $3, $4, TRUE, FALSE)`,
          [acc.id, acc.name, hash, acc.email]
        );
      } else {
        await pool.query(
          `INSERT INTO ${acc.table} (id, name, password, email, needs_password_reset) VALUES ($1, $2, $3, $4, FALSE)`,
          [acc.id, acc.name, hash, acc.email]
        );
      }
      console.log(`✓ Seeded ${acc.table} account: ${acc.id}`);
    } else {
      // If stored password is NOT a bcrypt hash, re-hash it
      const stored = existing.rows[0].password;
      const isBcrypt = stored.startsWith("$2");
      if (!isBcrypt) {
        const hash = await bcrypt.hash(stored, BCRYPT_ROUNDS);
        await pool.query(
          `UPDATE ${acc.table} SET password = $1 WHERE id = $2`,
          [hash, acc.id]
        );
        console.log(`✓ Migrated plain-text password for ${acc.table}: ${acc.id}`);
      }

      // Ensure email and needs_password_reset are updated for static test accounts
      if (acc.table !== "authorities") {
        await pool.query(
          `UPDATE ${acc.table} SET email = $1, needs_password_reset = FALSE WHERE id = $2`,
          [acc.email, acc.id]
        );
      }
    }
  }
}

// Initialize Database Tables
async function initializeDatabase() {
  try {
    console.log("Initializing database tables...");

    // Test connection first
    await pool.query("SELECT NOW()");
    console.log("✓ Database connection successful");

    // Create employees table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        needs_password_reset BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE").catch(() => {});
    await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS needs_password_reset BOOLEAN DEFAULT TRUE").catch(() => {});
    console.log("✓ employees table ready");

    // Create managers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS managers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        needs_password_reset BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query("ALTER TABLE managers ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE").catch(() => {});
    await pool.query("ALTER TABLE managers ADD COLUMN IF NOT EXISTS needs_password_reset BOOLEAN DEFAULT TRUE").catch(() => {});
    console.log("✓ managers table ready");

    // Create authorities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS authorities (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ authorities table ready");

    // Create complaints table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id VARCHAR(255) PRIMARY KEY,
        employee_id VARCHAR(255) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        room_id VARCHAR(10) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        visibility VARCHAR(20) NOT NULL DEFAULT 'private',
        parent_complaint_id VARCHAR(255),
        merged_into_id VARCHAR(255),
        rejection_reason TEXT,
        escalation_description TEXT,
        completion_description TEXT,
        completion_photo_uri TEXT,
        completed_at TIMESTAMP,
        rejection_history JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    // Add columns for existing DBs
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'private'`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS parent_complaint_id VARCHAR(255)`)
      .catch(() => {}); // ignore if already exists
    console.log("✓ complaints table ready");

    // Create merged_groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS merged_groups (
        id VARCHAR(255) PRIMARY KEY,
        room_id VARCHAR(10) NOT NULL,
        category VARCHAR(50) NOT NULL,
        manager_description TEXT NOT NULL,
        constituent_complaint_ids JSONB DEFAULT '[]',
        endorsed_by JSONB DEFAULT '[]',
        status VARCHAR(50) NOT NULL,
        escalation_note TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ merged_groups table ready");

    // Create merged_group_endorsements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS merged_group_endorsements (
        merged_group_id VARCHAR(255) NOT NULL,
        employee_id VARCHAR(255) NOT NULL,
        endorsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (merged_group_id, employee_id),
        FOREIGN KEY (merged_group_id) REFERENCES merged_groups(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ merged_group_endorsements table ready");

    // FIX #5: Removed the old migration block that conditionally dropped
    // re_complaints. The table is now created with the correct composite PK
    // (complaint_id, employee_id) from the start.
    // FIX #5: Changed PRIMARY KEY from (complaint_id) to (complaint_id, employee_id)
    // so multiple different employees can each re-complain on the same complaint.
    // The old single-column PK meant only one re-complaint per complaint was ever
    // stored, making the 5-re-complaint auto-escalation threshold unreachable.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS re_complaints (
        complaint_id VARCHAR(255) NOT NULL,
        employee_id VARCHAR(255) NOT NULL,
        room_id VARCHAR(10) NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (complaint_id, employee_id)
      )
    `);
    console.log("✓ re_complaints table ready");

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ sessions table ready");

    // Create rooms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        room_number VARCHAR(50) NOT NULL UNIQUE,
        floor_number VARCHAR(50) NOT NULL DEFAULT '1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor_number VARCHAR(50) NOT NULL DEFAULT '1'`).catch(() => {});
    console.log("✓ rooms table ready");

    // Seed default rooms if empty
    const roomCheck = await pool.query("SELECT COUNT(*) FROM rooms");
    if (parseInt(roomCheck.rows[0].count, 10) === 0) {
      const defaultRooms = Array.from({ length: 5 }, (_, floor) =>
        Array.from({ length: 5 }, (_, room) => ({
          room_number: `${floor + 1}${room + 1}`,
          floor_number: `${floor + 1}`
        }))
      ).flat();
      for (const r of defaultRooms) {
        await pool.query(
          "INSERT INTO rooms (room_number, floor_number) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [r.room_number, r.floor_number]
        );
      }
      console.log("✓ Seeded default rooms");
    }

    console.log("Database initialization complete!");

    // Seed/migrate manager and authority accounts with hashed passwords
    await seedStaticAccounts();
  } catch (err) {
    console.error("Database initialization error:", err.message);
    console.log("⚠️  Server will continue without database. Registrations will fail until database is available.");
    console.log("💡 To fix: Check Railway dashboard and wake up the database, or use local PostgreSQL.");
  }
}

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "API Running", status: "success" });
});

// Test database connection
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ 
      message: "Connected to Railway DB", 
      timestamp: result.rows[0],
      status: "connected"
    });
  } catch (err) {
    console.error("Database test failed:", err.message);
    res.status(500).json({ 
      error: "Database connection failed", 
      details: err.message,
      status: "disconnected",
      suggestion: "Check Railway dashboard - database may be paused. Visit https://railway.app to wake it up."
    });
  }
});

// ===== EMPLOYEE ENDPOINTS =====
app.post("/api/employees/register", async (req, res) => {
  try {
    const { id, name, username, password } = req.body;
    if (!id || !name || !username || !password) {
      return res.status(400).json({ error: "Missing required fields: id, name, username, password" });
    }
    
    const normalizedId = id.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // Password validation constraints (minimum 8 characters)
    if (normalizedPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(normalizedPassword)) {
      return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
    }
    if (!/[a-z]/.test(normalizedPassword)) {
      return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
    }
    if (!/[0-9]/.test(normalizedPassword)) {
      return res.status(400).json({ error: "Password must contain at least one numeric digit" });
    }
    if (!/[^a-zA-Z0-9]/.test(normalizedPassword)) {
      return res.status(400).json({ error: "Password must contain at least one special character/symbol" });
    }
    
    // Test database connection
    await pool.query("SELECT 1");
    
    // Check if employee email already exists (case-insensitive)
    const existingEmail = await pool.query("SELECT * FROM employees WHERE lower(id) = lower($1)", [normalizedId]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: "Employee email already exists" });
    }

    // Check if username already exists
    const existingUsername = await pool.query("SELECT * FROM employees WHERE lower(username) = lower($1)", [normalizedUsername]);
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, BCRYPT_ROUNDS);
    
    // Generate secure random string verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      "INSERT INTO employees (id, name, username, password, is_verified, verification_token) VALUES ($1, $2, $3, $4, FALSE, $5)",
      [normalizedId, normalizedName, normalizedUsername, hashedPassword, verificationToken]
    );

    // Send verification email in the background (do not await)
    sendVerificationEmail(normalizedId, verificationToken).catch((err) => {
      console.error("Mail delivery failure in background:", err.message);
    });

    res.status(201).json({ message: "Registration successful! Please check your email to verify your account." });
  } catch (err) {
    console.error("Employee registration error:", err.message);
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: "Database temporarily unavailable", 
        details: "The database is paused or unreachable. Please try again later or contact administrator.",
        suggestion: "Check Railway dashboard to wake up the database."
      });
    }
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

app.post("/api/employees/login", async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ error: "Missing userId or password" });
    }

    const normalizedUserId = userId.trim();
    const normalizedPassword = password.trim();

    const result = await pool.query("SELECT * FROM employees WHERE lower(id) = lower($1) OR lower(username) = lower($1) OR lower(email) = lower($1)", [normalizedUserId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "user not found" });
    }

    const employee = result.rows[0];
    if (!employee.is_verified) {
      return res.status(401).json({ error: "Please verify your email address to activate your account." });
    }
    const isBcrypt = employee.password && employee.password.startsWith("$2");
    const passwordMatch = isBcrypt
      ? await bcrypt.compare(normalizedPassword, employee.password)
      : employee.password ? (normalizedPassword === employee.password) : false;

    if (!passwordMatch) {
      return res.status(401).json({ error: "user not found" });
    }

    // First time login password reset interception
    if (employee.needs_password_reset) {
      return res.json({
        needsPasswordReset: true,
        role: "employee",
        userId: employee.id,
        email: employee.email || ""
      });
    }

    // Migrate plain-text password to bcrypt on first login
    if (!isBcrypt && employee.password) {
      const hashed = await bcrypt.hash(normalizedPassword, BCRYPT_ROUNDS);
      await pool.query("UPDATE employees SET password = $1 WHERE id = $2", [hashed, employee.id]);
    }

    const token = generateToken();
    await pool.query(
      "INSERT INTO sessions (token, user_id, user_role) VALUES ($1, $2, $3)",
      [token, employee.id, "employee"]
    );

    res.json({
      message: "Login successful",
      token,
      session: {
        role: "employee",
        userId: employee.id,
        name: employee.name,
        username: employee.username || "",
        email: employee.email || "",
        needsSetup: !employee.password
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});


app.get("/api/employees", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, password, created_at FROM employees ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

app.post("/api/employees/update-profile", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: "Forbidden: Employee role required" });
    }
    const { username, password, name } = req.body;
    const employeeId = req.user.userId;

    let updateQuery = "UPDATE employees SET is_verified = TRUE, ";
    const params = [];
    let paramIndex = 1;

    if (name && name.trim()) {
      updateQuery += `name = $${paramIndex}, `;
      params.push(name.trim());
      paramIndex++;
    }

    if (username && username.trim()) {
      const normalizedUsername = username.trim().toLowerCase();
      // Check if username is already taken by another user
      const existing = await pool.query(
        "SELECT 1 FROM employees WHERE (lower(username) = lower($1) OR lower(id) = lower($1)) AND lower(id) != lower($2)",
        [normalizedUsername, employeeId.toLowerCase()]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Username is already taken" });
      }
      updateQuery += `username = $${paramIndex}, `;
      params.push(normalizedUsername);
      paramIndex++;
    }

    if (password && password.trim()) {
      const normalizedPassword = password.trim();
      if (normalizedPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      if (!/[A-Z]/.test(normalizedPassword)) {
        return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
      }
      if (!/[a-z]/.test(normalizedPassword)) {
        return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
      }
      if (!/[0-9]/.test(normalizedPassword)) {
        return res.status(400).json({ error: "Password must contain at least one numeric digit" });
      }
      if (!/[^a-zA-Z0-9]/.test(normalizedPassword)) {
        return res.status(400).json({ error: "Password must contain at least one special character/symbol" });
      }

      const hashedPassword = await bcrypt.hash(normalizedPassword, BCRYPT_ROUNDS);
      updateQuery += `password = $${paramIndex}, `;
      params.push(hashedPassword);
      paramIndex++;
    }

    // Remove trailing comma and space
    if (params.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(employeeId);

    const result = await pool.query(updateQuery, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const updatedEmployee = result.rows[0];
    res.json({
      message: "Profile updated successfully",
      session: {
        role: "employee",
        userId: updatedEmployee.id,
        name: updatedEmployee.name,
        username: updatedEmployee.username || "",
        needsSetup: false
      }
    });

  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ error: "Profile update failed", details: err.message });
  }
});

app.get("/api/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; color: #dc2626;">
          <h1>Invalid Request</h1>
          <p>Verification token is missing.</p>
        </div>
      `);
    }

    const result = await pool.query(
      "SELECT * FROM employees WHERE verification_token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      // Token not found or expired
      return res.redirect("https://vijayalakshmibaik1031.github.io/VIJI-PDD/#/login?error=Invalid%20or%20expired%20verification%20token");
    }

    const employee = result.rows[0];

    // Flip is_verified to true and clear verification_token
    await pool.query(
      "UPDATE employees SET is_verified = TRUE, verification_token = NULL WHERE id = $1",
      [employee.id]
    );

    // Auto-login: Create a session token
    const sessionToken = generateToken();
    await pool.query(
      "INSERT INTO sessions (token, user_id, user_role) VALUES ($1, $2, $3)",
      [sessionToken, employee.id, "employee"]
    );

    // Redirect to frontend login with session credentials
    const redirectUrl = `https://vijayalakshmibaik1031.github.io/VIJI-PDD/#/login?token=${sessionToken}&userId=${encodeURIComponent(employee.id)}&name=${encodeURIComponent(employee.name)}&username=${encodeURIComponent(employee.username || '')}`;
    
    res.redirect(redirectUrl);

  } catch (err) {
    console.error("Email verification error:", err.message);
    res.status(500).send(`
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px; color: #dc2626;">
        <h1>Verification Failed</h1>
        <p>Verification failed. Please try again later.</p>
      </div>
    `);
  }
});

app.get("/api/employees/check-verification", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const result = await pool.query("SELECT * FROM employees WHERE lower(id) = lower($1)", [email.trim()]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const employee = result.rows[0];
    if (employee.is_verified) {
      // Create a session for auto-login
      const sessionToken = generateToken();
      await pool.query(
        "INSERT INTO sessions (token, user_id, user_role) VALUES ($1, $2, $3)",
        [sessionToken, employee.id, "employee"]
      );
      return res.json({
        verified: true,
        token: sessionToken,
        session: {
          role: "employee",
          userId: employee.id,
          name: employee.name,
          username: employee.username || "",
          needsSetup: false
        }
      });
    }
    res.json({ verified: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/test-backend-mail", async (req, res) => {
  try {
    console.log("Testing SMTP from backend server...");
    await sendVerificationEmail("vijayalakshmibai0686@gmail.com", "test-token-123");
    res.send("<h1>Email sent successfully from backend! Check your inbox.</h1>");
  } catch (err) {
    console.error("Test email failed:", err);
    res.status(500).send(`<h1>Failed to send email from backend</h1><pre>${err.stack || err.message || err}</pre>`);
  }
});

// ===== MANAGER ENDPOINTS =====
app.post("/api/managers/register", async (req, res) => {
  try {
    const { id, name, password } = req.body;
    if (!id || !name || !password) {
      return res.status(400).json({ error: "Missing required fields: id, name, password" });
    }

    const normalizedId = id.trim();
    const normalizedName = name.trim();
    const normalizedPassword = password.trim();

    // Test database connection
    await pool.query("SELECT 1");
    
    const existing = await pool.query("SELECT * FROM managers WHERE lower(id) = lower($1)", [normalizedId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Manager ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, BCRYPT_ROUNDS);
    await pool.query("INSERT INTO managers (id, name, password) VALUES ($1, $2, $3)", [normalizedId, normalizedName, hashedPassword]);
    res.status(201).json({ message: "Manager registered successfully" });
  } catch (err) {
    console.error("Manager registration error:", err.message);
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: "Database temporarily unavailable", 
        details: "The database is paused or unreachable. Please try again later or contact administrator.",
        suggestion: "Check Railway dashboard to wake up the database."
      });
    }
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

app.post("/api/managers/login", async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ error: "Missing userId or password" });
    }

    const normalizedUserId = userId.trim();
    const normalizedPassword = password.trim();

    const result = await pool.query("SELECT * FROM managers WHERE lower(id) = lower($1) OR lower(email) = lower($1)", [normalizedUserId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid manager credentials" });
    }

    const manager = result.rows[0];
    const isBcrypt = manager.password && manager.password.startsWith("$2");
    const passwordMatch = isBcrypt
      ? await bcrypt.compare(normalizedPassword, manager.password)
      : manager.password ? (normalizedPassword === manager.password) : false;

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid manager credentials" });
    }

    // First time login password reset interception
    if (manager.needs_password_reset) {
      return res.json({
        needsPasswordReset: true,
        role: "manager",
        userId: manager.id,
        email: manager.email || ""
      });
    }

    if (!isBcrypt && manager.password) {
      const hashed = await bcrypt.hash(normalizedPassword, BCRYPT_ROUNDS);
      await pool.query("UPDATE managers SET password = $1 WHERE id = $2", [hashed, manager.id]);
    }

    const token = generateToken();
    await pool.query(
      "INSERT INTO sessions (token, user_id, user_role) VALUES ($1, $2, $3)",
      [token, manager.id, "manager"]
    );

    res.json({
      message: "Login successful",
      token,
      session: {
        role: "manager",
        userId: manager.id,
        name: manager.name,
        email: manager.email || ""
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

app.get("/api/managers", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, password, created_at FROM managers ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch managers" });
  }
});

// ===== USER MANAGEMENT & PASSWORD RESET ENDPOINTS =====

// POST /api/auth/reset-first-password
app.post("/api/auth/reset-first-password", async (req, res) => {
  try {
    const { role, userId, email, newPassword } = req.body;
    if (!role || !userId || !email || !newPassword) {
      return res.status(400).json({ error: "Missing required fields: role, userId, email, newPassword" });
    }

    if (role !== "employee" && role !== "manager") {
      return res.status(400).json({ error: "Invalid role for first-time password reset" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUserId = userId.trim();

    if (!normalizedEmail.endsWith("@xyzcompany.com")) {
      return res.status(400).json({ error: "Email must be a valid @xyzcompany.com address" });
    }

    // Validate new password rules (min 8 chars, uppercase, lowercase, numeric, special)
    const normalizedPassword = newPassword.trim();
    if (normalizedPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(normalizedPassword)) {
      return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
    }
    if (!/[a-z]/.test(normalizedPassword)) {
      return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
    }
    if (!/[0-9]/.test(normalizedPassword)) {
      return res.status(400).json({ error: "Password must contain at least one numeric digit" });
    }
    if (!/[^a-zA-Z0-9]/.test(normalizedPassword)) {
      return res.status(400).json({ error: "Password must contain at least one special character/symbol" });
    }

    const table = role === "employee" ? "employees" : "managers";
    const userQuery = await pool.query(
      `SELECT * FROM ${table} WHERE lower(id) = lower($1) AND lower(email) = lower($2)`,
      [normalizedUserId, normalizedEmail]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User not found with matching ID and email" });
    }

    const user = userQuery.rows[0];
    if (!user.needs_password_reset) {
      return res.status(400).json({ error: "Password has already been reset. Please login normally." });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, BCRYPT_ROUNDS);
    await pool.query(
      `UPDATE ${table} SET password = $1, needs_password_reset = FALSE WHERE id = $2`,
      [hashedPassword, user.id]
    );

    // Create session token and log user in automatically
    const token = generateToken();
    await pool.query(
      "INSERT INTO sessions (token, user_id, user_role) VALUES ($1, $2, $3)",
      [token, user.id, role]
    );

    res.json({
      message: "Password reset successful",
      token,
      session: {
        role,
        userId: user.id,
        name: user.name,
        email: normalizedEmail
      }
    });
  } catch (err) {
    console.error("Password reset error:", err.message);
    res.status(500).json({ error: "Password reset failed", details: err.message });
  }
});

// POST /api/managers (Authority only)
app.post("/api/managers", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "authority") {
      return res.status(403).json({ error: "Forbidden: Authority role required" });
    }

    const { id, name, email } = req.body;
    if (!id || !name || !email) {
      return res.status(400).json({ error: "Missing required fields: id, name, email" });
    }

    const normalizedId = id.trim();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@xyzcompany.com")) {
      return res.status(400).json({ error: "Email must be a valid @xyzcompany.com address" });
    }

    // Check if manager already exists
    const existing = await pool.query(
      "SELECT 1 FROM managers WHERE lower(id) = lower($1) OR lower(email) = lower($2)",
      [normalizedId, normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Manager with this ID or Email already exists" });
    }

    // Password defaults to "Welcome123$"
    const defaultPassword = "Welcome123$";
    const hashedPassword = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);

    await pool.query(
      "INSERT INTO managers (id, name, email, password, needs_password_reset) VALUES ($1, $2, $3, $4, TRUE)",
      [normalizedId, normalizedName, normalizedEmail, hashedPassword]
    );

    res.status(201).json({ message: "Manager created successfully" });
  } catch (err) {
    console.error("Manager creation error:", err.message);
    res.status(500).json({ error: "Failed to create manager", details: err.message });
  }
});

// PUT /api/managers/:id (Authority only)
app.put("/api/managers/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "authority") {
      return res.status(403).json({ error: "Forbidden: Authority role required" });
    }

    const managerId = req.params.id;
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Missing required fields: name, email" });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@xyzcompany.com")) {
      return res.status(400).json({ error: "Email must be a valid @xyzcompany.com address" });
    }

    // Check if another manager already has this email
    const existingEmail = await pool.query(
      "SELECT 1 FROM managers WHERE lower(email) = lower($1) AND lower(id) != lower($2)",
      [normalizedEmail, managerId]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: "Another manager is already using this email" });
    }

    const updateRes = await pool.query(
      "UPDATE managers SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [normalizedName, normalizedEmail, managerId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Manager not found" });
    }

    res.json({ message: "Manager updated successfully" });
  } catch (err) {
    console.error("Manager update error:", err.message);
    res.status(500).json({ error: "Failed to update manager", details: err.message });
  }
});

// POST /api/employees (Authority/Manager)
app.post("/api/employees", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "authority" && req.user.role !== "manager") {
      return res.status(403).json({ error: "Forbidden: Manager or Authority role required" });
    }

    const { id, name, email } = req.body;
    if (!id || !name || !email) {
      return res.status(400).json({ error: "Missing required fields: id, name, email" });
    }

    const normalizedId = id.trim();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@xyzcompany.com")) {
      return res.status(400).json({ error: "Email must be a valid @xyzcompany.com address" });
    }

    // Check if employee already exists
    const existing = await pool.query(
      "SELECT 1 FROM employees WHERE lower(id) = lower($1) OR lower(email) = lower($2)",
      [normalizedId, normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Employee with this ID or Email already exists" });
    }

    // Password defaults to "Welcome123$"
    const defaultPassword = "Welcome123$";
    const hashedPassword = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);

    await pool.query(
      "INSERT INTO employees (id, name, email, password, needs_password_reset, is_verified) VALUES ($1, $2, $3, $4, TRUE, TRUE)",
      [normalizedId, normalizedName, normalizedEmail, hashedPassword]
    );

    res.status(201).json({ message: "Employee created successfully" });
  } catch (err) {
    console.error("Employee creation error:", err.message);
    res.status(500).json({ error: "Failed to create employee", details: err.message });
  }
});

// PUT /api/employees/:id (Authority/Manager)
app.put("/api/employees/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "authority" && req.user.role !== "manager") {
      return res.status(403).json({ error: "Forbidden: Manager or Authority role required" });
    }

    const employeeId = req.params.id;
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Missing required fields: name, email" });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@xyzcompany.com")) {
      return res.status(400).json({ error: "Email must be a valid @xyzcompany.com address" });
    }

    // Check if another employee already has this email
    const existingEmail = await pool.query(
      "SELECT 1 FROM employees WHERE lower(email) = lower($1) AND lower(id) != lower($2)",
      [normalizedEmail, employeeId]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: "Another employee is already using this email" });
    }

    const updateRes = await pool.query(
      "UPDATE employees SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [normalizedName, normalizedEmail, employeeId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.error("Employee update error:", err.message);
    res.status(500).json({ error: "Failed to update employee", details: err.message });
  }
});

// DELETE /api/managers/:id (Authority only)
app.delete("/api/managers/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "authority") {
      return res.status(403).json({ error: "Forbidden: Authority role required" });
    }

    const managerId = req.params.id;
    const result = await pool.query("DELETE FROM managers WHERE id = $1 RETURNING *", [managerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Manager not found" });
    }

    // Also clean up any active sessions for this manager
    await pool.query("DELETE FROM sessions WHERE user_id = $1", [managerId]).catch(() => {});

    res.json({ message: "Manager deleted successfully" });
  } catch (err) {
    console.error("Manager deletion error:", err.message);
    res.status(500).json({ error: "Failed to delete manager", details: err.message });
  }
});

// DELETE /api/employees/:id (Authority only)
app.delete("/api/employees/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "authority") {
      return res.status(403).json({ error: "Forbidden: Authority role required" });
    }

    const employeeId = req.params.id;
    const result = await pool.query("DELETE FROM employees WHERE id = $1 RETURNING *", [employeeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Also clean up any active sessions for this employee
    await pool.query("DELETE FROM sessions WHERE user_id = $1", [employeeId]).catch(() => {});

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Employee deletion error:", err.message);
    res.status(500).json({ error: "Failed to delete employee", details: err.message });
  }
});

// ===== AUTHORITY ENDPOINTS =====
app.post("/api/authorities/register", async (req, res) => {
  try {
    const { id, name, password } = req.body;
    if (!id || !name || !password) {
      return res.status(400).json({ error: "Missing required fields: id, name, password" });
    }

    const normalizedId = id.trim();
    const normalizedName = name.trim();
    const normalizedPassword = password.trim();

    // Test database connection
    await pool.query("SELECT 1");
    
    const existing = await pool.query("SELECT * FROM authorities WHERE lower(id) = lower($1)", [normalizedId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Authority ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, BCRYPT_ROUNDS);
    await pool.query("INSERT INTO authorities (id, name, password) VALUES ($1, $2, $3)", [normalizedId, normalizedName, hashedPassword]);
    res.status(201).json({ message: "Authority registered successfully" });
  } catch (err) {
    console.error("Authority registration error:", err.message);
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: "Database temporarily unavailable", 
        details: "The database is paused or unreachable. Please try again later or contact administrator.",
        suggestion: "Check Railway dashboard to wake up the database."
      });
    }
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

app.post("/api/authorities/login", async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ error: "Missing userId or password" });
    }

    const normalizedUserId = userId.trim();
    const normalizedPassword = password.trim();

    const result = await pool.query("SELECT * FROM authorities WHERE lower(id) = lower($1)", [normalizedUserId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid authority credentials" });
    }

    const authority = result.rows[0];
    const isBcrypt = authority.password.startsWith("$2");
    const passwordMatch = isBcrypt
      ? await bcrypt.compare(normalizedPassword, authority.password)
      : normalizedPassword === authority.password;

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid authority credentials" });
    }

    if (!isBcrypt) {
      const hashed = await bcrypt.hash(normalizedPassword, BCRYPT_ROUNDS);
      await pool.query("UPDATE authorities SET password = $1 WHERE id = $2", [hashed, authority.id]);
    }

    const token = generateToken();
    await pool.query(
      "INSERT INTO sessions (token, user_id, user_role) VALUES ($1, $2, $3)",
      [token, authority.id, "authority"]
    );

    res.json({
      message: "Login successful",
      token,
      session: {
        role: "authority",
        userId: authority.id,
        name: authority.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

app.get("/api/authorities", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, created_at FROM authorities ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch authorities" });
  }
});

// ===== LOGOUT =====
app.post("/api/auth/logout", requireAuth, async (req, res) => {
  try {
    const token = req.headers["authorization"].slice(7);
    await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Logout failed" });
  }
});

// ===== COMPLAINT ENDPOINTS =====
app.post("/api/complaints", requireAuth, async (req, res) => {
  try {
    const { id, employeeId, employeeName, roomId, category, description, completionPhotoUri, parentComplaintId } = req.body;

    if (!id || !employeeId || !employeeName || !roomId || !category || !description) {
      return res.status(400).json({ error: "Missing required complaint fields" });
    }

    await pool.query(
      `INSERT INTO complaints (id, employee_id, employee_name, room_id, category, description, status, visibility, completion_photo_uri, parent_complaint_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, employeeId, employeeName, roomId, category, description, "pending", "private", completionPhotoUri || null, parentComplaintId || null]
    );

    res.status(201).json({ message: "Complaint created successfully", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create complaint", details: err.message });
  }
});

app.get("/api/complaints", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM complaints ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

app.get("/api/complaints/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM complaints WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
});

app.get("/api/complaints/employee/:employeeId", requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await pool.query(
      "SELECT * FROM complaints WHERE employee_id = $1 ORDER BY created_at DESC",
      [employeeId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employee complaints" });
  }
});

app.patch("/api/complaints/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    await pool.query("UPDATE complaints SET status = $1 WHERE id = $2", [status, id]);
    res.json({ message: "Complaint status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update complaint status" });
  }
});

app.patch("/api/complaints/:id/complete", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const description = req.body.completionDescription ?? req.body.description ?? null;
    const photoUri = req.body.completionPhotoUri ?? req.body.photoUri ?? null;

    await pool.query(
      `UPDATE complaints 
       SET status = $1, completion_description = $2, completion_photo_uri = $3, completed_at = NOW()
       WHERE id = $4`,
      ["completed", description || null, photoUri || null, id]
    );

    res.json({ message: "Complaint completed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete complaint" });
  }
});

app.patch("/api/complaints/:id/reject", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: "Rejection reason is required (min 5 characters)" });
    }

    // Get current complaint
    const complaintResult = await pool.query("SELECT * FROM complaints WHERE id = $1", [id]);
    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    const complaint = complaintResult.rows[0];

    // FIX: Count total rejections across ALL complaints for this employee+room+category
    // (not just this complaint's history) — each re-raise is a new complaint with empty history
    const totalCountResult = await pool.query(
      `SELECT COALESCE(SUM(jsonb_array_length(rejection_history)), 0) AS total
       FROM complaints
       WHERE employee_id = $1 AND room_id = $2 AND category = $3`,
      [complaint.employee_id, complaint.room_id, complaint.category]
    );
    const totalRejections = parseInt(totalCountResult.rows[0].total, 10);
    const nextCount = totalRejections + 1;

    // Append to this complaint's own history for record-keeping
    const history = Array.isArray(complaint.rejection_history) ? complaint.rejection_history : [];
    const newHistory = [
      ...history,
      { reason: reason.trim(), rejectedAt: new Date().toISOString(), count: nextCount }
    ];

    // Auto-escalate at 5 or more total rejections — do NOT reject, go straight to escalated
    if (nextCount >= 5) {
      await pool.query(
        `UPDATE complaints SET status = $1, escalation_description = $2, rejection_history = $3 WHERE id = $4`,
        ["escalated", reason.trim(), JSON.stringify(newHistory), id]
      );
      return res.json({ message: "Auto-escalated to authority after 5 rejections", escalated: true, count: nextCount });
    }

    await pool.query(
      "UPDATE complaints SET status = $1, rejection_reason = $2, rejection_history = $3 WHERE id = $4",
      ["rejected", reason.trim(), JSON.stringify(newHistory), id]
    );

    res.json({ message: "Complaint rejected successfully", escalated: false, count: nextCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject complaint" });
  }
});

app.patch("/api/complaints/:id/escalate", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Escalation reason is required" });
    }

    await pool.query(
      "UPDATE complaints SET status = $1, escalation_description = $2 WHERE id = $3",
      ["escalated", reason, id]
    );

    res.json({ message: "Complaint escalated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to escalate complaint" });
  }
});

// Get rejection count for a specific employee/room/category
app.get("/api/complaints/rejection-count", requireAuth, async (req, res) => {
  try {
    const { employeeId, roomId, category } = req.query;
    if (!employeeId || !roomId || !category) {
      return res.status(400).json({ error: "employeeId, roomId, category required" });
    }
    const result = await pool.query(
      "SELECT rejection_history FROM complaints WHERE employee_id = $1 AND room_id = $2 AND category = $3",
      [employeeId, roomId, category]
    );
    const count = result.rows.reduce((total, row) => {
      const history = Array.isArray(row.rejection_history) ? row.rejection_history : [];
      return total + history.length;
    }, 0);
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get rejection count" });
  }
});

// Check if employee has already re-complained for a specific complaint
app.get("/api/complaints/has-recomplained", requireAuth, async (req, res) => {
  try {
    const { employeeId, roomId, category, complaintId } = req.query;
    if (!employeeId || !roomId || !category) {
      return res.status(400).json({ error: "employeeId, roomId, category required" });
    }
    let result;
    if (complaintId) {
      // Per-complaint check (preferred)
      result = await pool.query(
        "SELECT 1 FROM re_complaints WHERE complaint_id = $1 AND employee_id = $2",
        [complaintId, employeeId]
      );
    } else {
      // Fallback: any re-complaint for this room+category
      result = await pool.query(
        "SELECT 1 FROM re_complaints WHERE employee_id = $1 AND room_id = $2 AND category = $3",
        [employeeId, roomId, category]
      );
    }
    res.json({ hasRecomplained: result.rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check re-complain status" });
  }
});

// Mark that an employee has re-complained for a specific complaint
// Also checks if this is the 5th re-complaint → auto-escalate
app.post("/api/complaints/mark-recomplained", requireAuth, async (req, res) => {
  try {
    const { employeeId, roomId, category, complaintId } = req.body;
    if (!employeeId || !roomId || !category || !complaintId) {
      return res.status(400).json({ error: "employeeId, roomId, category, complaintId required" });
    }

    // FIX #5: ON CONFLICT now uses the composite PK (complaint_id, employee_id)
    // so each employee can re-complain once per complaint, and multiple employees
    // can all re-complain on the same complaint independently.
    await pool.query(
      `INSERT INTO re_complaints (complaint_id, employee_id, room_id, category)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (complaint_id, employee_id) DO NOTHING`,
      [complaintId, employeeId, roomId, category]
    );

    // FIX #5: Count distinct employees who re-complained on THIS specific
    // complaint (not across all complaints for the room+category). This is what
    // drives the per-complaint auto-escalation threshold.
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM re_complaints WHERE complaint_id = $1`,
      [complaintId]
    );
    const reComplaintCount = parseInt(countResult.rows[0].count, 10);

    // Auto-escalate the current complaint after 5th re-complaint submitted
    if (reComplaintCount >= 5) {
      await pool.query(
        `UPDATE complaints SET status = 'escalated', escalation_description = $1
         WHERE id = $2 AND status NOT IN ('escalated', 'completed', 'acknowledged')`,
        [`Auto-escalated: employee submitted ${reComplaintCount} re-complaints`, complaintId]
      );
      return res.json({ message: "Marked as re-complained and auto-escalated", escalated: true, reComplaintCount });
    }

    res.json({ message: "Marked as re-complained", escalated: false, reComplaintCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark re-complain" });
  }
});

// ===== MERGED GROUPS ENDPOINTS =====
app.post("/api/merged-groups", requireAuth, async (req, res) => {
  try {
    const { id, roomId, category, managerDescription, complaintIds } = req.body;

    if (!id || !roomId || !category || !managerDescription || !complaintIds) {
      return res.status(400).json({ error: "Missing required merged group fields" });
    }

    // FIX #6: Validate that the complaints come from at least 5 unique employees
    // before allowing a merge. server-sqlite.js already had this check; server.js
    // was missing it entirely, allowing merges with any number of complaints.
    if (!Array.isArray(complaintIds) || complaintIds.length === 0) {
      return res.status(400).json({ error: "complaintIds must be a non-empty array" });
    }

    const employeeRows = await pool.query(
      `SELECT DISTINCT employee_id FROM complaints WHERE id = ANY($1::text[])`,
      [complaintIds]
    );
    if (employeeRows.rows.length < 5) {
      return res.status(400).json({
        error: `Merge requires complaints from at least 5 unique employees. Found ${employeeRows.rows.length}.`,
      });
    }
    await pool.query(
      `INSERT INTO merged_groups (id, room_id, category, manager_description, constituent_complaint_ids, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, roomId, category, managerDescription, JSON.stringify(complaintIds), "merged_public"]
    );

    // Update complaints to mark them as merged and public
    for (const complaintId of complaintIds) {
      await pool.query(
        "UPDATE complaints SET merged_into_id = $1, status = $2, visibility = $3 WHERE id = $4",
        [id, "merged_public", "public", complaintId],
      );
    }

    res.status(201).json({ message: "Complaints merged successfully", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to merge complaints", details: err.message });
  }
});

app.get("/api/merged-groups", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, COALESCE(jsonb_agg(e.employee_id ORDER BY e.employee_id) FILTER (WHERE e.employee_id IS NOT NULL), '[]') AS endorsed_by
       FROM merged_groups m
       LEFT JOIN merged_group_endorsements e ON e.merged_group_id = m.id
       GROUP BY m.id
       ORDER BY m.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch merged groups" });
  }
});

app.get("/api/merged-groups/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT m.*, COALESCE(jsonb_agg(e.employee_id ORDER BY e.employee_id) FILTER (WHERE e.employee_id IS NOT NULL), '[]') AS endorsed_by
       FROM merged_groups m
       LEFT JOIN merged_group_endorsements e ON e.merged_group_id = m.id
       WHERE m.id = $1
       GROUP BY m.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Merged group not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch merged group" });
  }
});

app.post("/api/merged-groups/:id/endorse", requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.body;
    const { id } = req.params;
    if (!employeeId) return res.status(400).json({ error: "employeeId required" });

    const groupResult = await pool.query("SELECT * FROM merged_groups WHERE id = $1", [id]);
    if (groupResult.rows.length === 0) return res.status(404).json({ error: "Merged group not found" });

    // Allow everyone to endorse, including original submitters

    // FIX #7: Use INSERT ... ON CONFLICT DO NOTHING and check rowCount instead
    // of relying on a caught PK-violation exception for normal control flow.
    // This avoids noisy error logs and is the correct idiomatic approach.
    const insertResult = await pool.query(
      `INSERT INTO merged_group_endorsements (merged_group_id, employee_id)
       VALUES ($1, $2)
       ON CONFLICT (merged_group_id, employee_id) DO NOTHING`,
      [id, employeeId],
    );

    if (insertResult.rowCount === 0) {
      return res.status(400).json({ error: "Already endorsed" });
    }

    const endorsementsResult = await pool.query(
      "SELECT employee_id FROM merged_group_endorsements WHERE merged_group_id = $1 ORDER BY employee_id",
      [id],
    );
    const endorsedBy = endorsementsResult.rows.map((row) => row.employee_id);

    await pool.query(
      "UPDATE merged_groups SET endorsed_by = $1 WHERE id = $2",
      [JSON.stringify(endorsedBy), id],
    );

    res.json({ message: "Endorsed", endorsedBy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to endorse merged group", details: err.message });
  }
});

app.patch("/api/merged-groups/:id/escalate", requireAuth, async (req, res) => {
  try {
    const { escalationNote } = req.body;
    const { id } = req.params;
    await pool.query(
      "UPDATE merged_groups SET status = $1, escalation_note = $2 WHERE id = $3",
      ["escalated", escalationNote || '', id],
    );
    res.json({ message: "Merged group escalated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to escalate merged group", details: err.message });
  }
});

app.patch("/api/merged-groups/:id/acknowledge", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      "UPDATE merged_groups SET status = $1 WHERE id = $2",
      ["acknowledged", id],
    );
    res.json({ message: "Merged group acknowledged" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to acknowledge merged group", details: err.message });
  }
});

// ===== ROOMS CRUD ENDPOINTS =====
app.get("/api/rooms", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rooms ORDER BY room_number ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

app.post("/api/rooms", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'authority') {
      return res.status(403).json({ error: "Forbidden: Authority role required" });
    }
    const { roomNumber, floorNumber } = req.body;
    if (!roomNumber || !roomNumber.trim()) {
      return res.status(400).json({ error: "Room number is required" });
    }
    const normalizedRoom = roomNumber.trim();
    const normalizedFloor = (floorNumber || "1").trim();
    const existing = await pool.query("SELECT 1 FROM rooms WHERE LOWER(room_number) = LOWER($1)", [normalizedRoom]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Room number already exists" });
    }
    const result = await pool.query(
      "INSERT INTO rooms (room_number, floor_number) VALUES ($1, $2) RETURNING *",
      [normalizedRoom, normalizedFloor]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.put("/api/rooms/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'authority') {
      return res.status(403).json({ error: "Forbidden: Authority role required" });
    }
    const { id } = req.params;
    const { roomNumber, floorNumber } = req.body;
    if (!roomNumber || !roomNumber.trim()) {
      return res.status(400).json({ error: "Room number is required" });
    }
    const normalizedRoom = roomNumber.trim();
    const normalizedFloor = (floorNumber || "1").trim();
    const existing = await pool.query(
      "SELECT 1 FROM rooms WHERE LOWER(room_number) = LOWER($1) AND id != $2",
      [normalizedRoom, id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Room number already exists" });
    }
    const result = await pool.query(
      "UPDATE rooms SET room_number = $1, floor_number = $2 WHERE id = $3 RETURNING *",
      [normalizedRoom, normalizedFloor, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update room" });
  }
});

app.delete("/api/rooms/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'authority') {
      return res.status(403).json({ error: "Forbidden: Authority role required" });
    }
    const { id } = req.params;
    const result = await pool.query("DELETE FROM rooms WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete room" });
  }
});


// Start server
const PORT = process.env.PORT || 5000;

(async () => {
  await initializeDatabase();
  
  const HOST = process.env.HOST || "0.0.0.0";
  app.listen(PORT, HOST, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ LAN access: http://<your-pc-ip>:${PORT}`);
    console.log(`✓ Connected to Railway PostgreSQL Database\n`);
  });
})();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await pool.end();
  process.exit(0);
});
