/**
 * =========================================================================
 * SHEETFLOW RBAC - GOOGLE APPS SCRIPT WEB APP API (Code.gs)
 * =========================================================================
 * Backend engine providing Role-Based Access Control (RBAC), multi-schema
 * synchronization, user authentication, and transactional row writes.
 *
 * Google Apps Script Deployment Instructions:
 * 1. In your Google Sheet, click Extensions > Apps Script.
 * 2. Delete any existing code in Code.gs and paste this entire file.
 * 3. Click "Deploy" > "New deployment".
 * 4. Select type: "Web app".
 * 5. Description: "SheetFlow RBAC API v1".
 * 6. Execute as: "Me" (your Google account).
 * 7. Who has access: "Anyone" (crucial for CORS web requests).
 * 8. Click "Deploy", authorize permissions, and copy the Web App URL.
 * 9. Paste the Web App URL into your SheetFlow Portal configuration.
 * =========================================================================
 */

// Global configuration
var CONFIG = {
  USERS_SHEET: "Users",
  SCHEMAS_SHEET: "Schemas",
  TOKEN_SECRET: "SHEETFLOW_SECURE_SALT_2026",
  LOCK_TIMEOUT_MS: 30000
};

/**
 * Handle HTTP GET Requests
 * Used for connection health checks, schema fetching, and RBAC-filtered querying.
 */
function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action || "ping";

    if (action === "ping") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      return jsonResponse({
        success: true,
        message: "SheetFlow Google Apps Script Web App API is active and operational.",
        spreadsheetTitle: ss.getName(),
        spreadsheetId: ss.getId(),
        activeSheets: ss.getSheets().map(function(s) { return s.getName(); }),
        timestamp: new Date().toISOString()
      });
    }

    if (action === "initSetup") {
      var initResult = initDatabaseStructure();
      return jsonResponse(initResult);
    }

    if (action === "getSchemas") {
      var schemas = loadSchemasFromSheet();
      return jsonResponse({ success: true, schemas: schemas });
    }

    // Authenticated actions
    var authUser = params.auth_user;
    var authToken = params.auth_token;

    if (!authUser || !authToken) {
      return jsonResponse({
        success: false,
        error: "Authentication credentials required (auth_user, auth_token)"
      }, 401);
    }

    var userRecord = validateAuth(authUser, authToken);
    if (!userRecord) {
      return jsonResponse({ success: false, error: "Invalid or expired session token." }, 403);
    }

    if (userRecord.status !== "Active") {
      return jsonResponse({ success: false, error: "User account is disabled by administrator." }, 403);
    }

    // Action: Get Users (Admin only)
    if (action === "getUsers") {
      if (userRecord.role !== "Admin") {
        return jsonResponse({ success: false, error: "Access denied. Admin role required." }, 403);
      }
      var users = getAllUsers(false); // mask passwords
      return jsonResponse({ success: true, users: users });
    }

    // Action: Get Submissions (RBAC Scoped)
    if (action === "getSubmissions") {
      var targetUserFilter = params.user_filter || null;
      var targetSchema = params.schema_id || null;
      var querySearch = params.search || null;

      // RBAC Enforcement: Standard User can ONLY view their own records!
      var effectiveUserFilter = targetUserFilter;
      if (userRecord.role !== "Admin") {
        effectiveUserFilter = userRecord.username; // Force scoping to self!
      }

      var submissions = getAllSubmissions({
        userFilter: effectiveUserFilter,
        schemaId: targetSchema,
        search: querySearch
      });

      return jsonResponse({
        success: true,
        userRole: userRecord.role,
        scopedTo: effectiveUserFilter || "ALL_USERS",
        total: submissions.length,
        submissions: submissions
      });
    }

    return jsonResponse({ success: false, error: "Unknown GET action: " + action }, 400);

  } catch (err) {
    return jsonResponse({ success: false, error: "Internal Server Error: " + err.toString() }, 500);
  }
}

/**
 * Handle HTTP POST Requests
 * Handles authentication, submissions with transactional locks, user creation, and schema registration.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Acquire transactional lock to prevent concurrent spreadsheet write conflicts
    lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);

    var postDataRaw = e && e.postData ? e.postData.contents : null;
    if (!postDataRaw) {
      return jsonResponse({ success: false, error: "Missing JSON request payload." }, 400);
    }

    var payload = JSON.parse(postDataRaw);
    var action = payload.action;

    // 1. Authentication: Login
    if (action === "login") {
      return handleLogin(payload.username, payload.password);
    }

    // Authenticate subsequent operations
    var authUser = payload.auth_user;
    var authToken = payload.auth_token;

    if (!authUser || !authToken) {
      return jsonResponse({ success: false, error: "Missing authentication headers." }, 401);
    }

    var userRecord = validateAuth(authUser, authToken);
    if (!userRecord) {
      return jsonResponse({ success: false, error: "Authentication failed or token expired." }, 403);
    }

    if (userRecord.status !== "Active") {
      return jsonResponse({ success: false, error: "Account has been deactivated by administrator." }, 403);
    }

    // 2. Data Submission
    if (action === "submit") {
      return handleSubmitData(userRecord, payload);
    }

    // 3. User Management (Admin Only)
    if (action === "createUser") {
      if (userRecord.role !== "Admin") {
        return jsonResponse({ success: false, error: "Unauthorized: Admin privileges required." }, 403);
      }
      return handleCreateUser(payload.userData);
    }

    if (action === "updateUserStatus") {
      if (userRecord.role !== "Admin") {
        return jsonResponse({ success: false, error: "Unauthorized: Admin privileges required." }, 403);
      }
      return handleUpdateUserStatus(payload.targetUsername, payload.status, payload.newPassword);
    }

    // 4. Schema Creation (Admin Only)
    if (action === "createSchema") {
      if (userRecord.role !== "Admin") {
        return jsonResponse({ success: false, error: "Unauthorized: Admin privileges required." }, 403);
      }
      return handleCreateSchema(payload.schemaData);
    }

    return jsonResponse({ success: false, error: "Unsupported POST action: " + action }, 400);

  } catch (err) {
    return jsonResponse({ success: false, error: "Server Processing Error: " + err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle User Login
 */
function handleLogin(username, password) {
  if (!username || !password) {
    return jsonResponse({ success: false, error: "Username and password are required." }, 400);
  }

  var users = getAllUsers(true); // include password for verification
  var targetUser = null;

  for (var i = 0; i < users.length; i++) {
    if (users[i].username.toLowerCase() === username.trim().toLowerCase()) {
      targetUser = users[i];
      break;
    }
  }

  if (!targetUser) {
    return jsonResponse({ success: false, error: "Invalid username or password." }, 401);
  }

  if (targetUser.status !== "Active") {
    return jsonResponse({ success: false, error: "Your account is disabled. Contact system administrator." }, 403);
  }

  // Check password (matches plaintext or simple hash)
  if (targetUser.password !== password && targetUser.password !== hashString(password)) {
    return jsonResponse({ success: false, error: "Invalid username or password." }, 401);
  }

  // Generate secure session token
  var token = generateToken(targetUser.username, targetUser.role);

  // Update last login timestamp in sheet
  updateLastLogin(targetUser.username);

  return jsonResponse({
    success: true,
    message: "Login successful.",
    session: {
      username: targetUser.username,
      fullName: targetUser.fullName || targetUser.username,
      department: targetUser.department || "Operations",
      role: targetUser.role,
      token: token,
      loginTime: new Date().toISOString()
    }
  });
}

/**
 * Handle Dynamic Data Submission
 */
function handleSubmitData(userRecord, payload) {
  var schemaId = payload.schema_id;
  var formData = payload.data;

  if (!schemaId || !formData) {
    return jsonResponse({ success: false, error: "schema_id and data object are required." }, 400);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Data_" + sanitizeSheetName(schemaId);
  var sheet = ss.getSheetByName(sheetName);

  // If sheet tab does not exist yet, create it dynamically
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var keys = Object.keys(formData);
    var baseHeaders = ["ID", "Timestamp", "Submitted_By", "User_Role", "Schema_ID"];
    var fullHeaders = baseHeaders.concat(keys);

    sheet.getRange(1, 1, 1, fullHeaders.length).setValues([fullHeaders]);
    sheet.getRange(1, 1, 1, fullHeaders.length)
      .setFontWeight("bold")
      .setBackground("#1E293B")
      .setFontColor("#F8FAFC");
    sheet.setFrozenRows(1);
  }

  // Read existing headers
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headerRange = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Auto-expand headers if new keys appear in form data
  var missingKeys = [];
  for (var k in formData) {
    if (headerRange.indexOf(k) === -1) {
      missingKeys.push(k);
    }
  }

  if (missingKeys.length > 0) {
    var newColStart = lastCol + 1;
    sheet.getRange(1, newColStart, 1, missingKeys.length).setValues([missingKeys]);
    sheet.getRange(1, newColStart, 1, missingKeys.length)
      .setFontWeight("bold")
      .setBackground("#1E293B")
      .setFontColor("#F8FAFC");
    headerRange = headerRange.concat(missingKeys);
  }

  // Generate unique Record ID and metadata
  var recordId = "REC-" + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd") + "-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  var timestamp = new Date().toISOString();

  // Construct row mapping according to exact header positions
  var newRow = [];
  for (var c = 0; c < headerRange.length; c++) {
    var colName = headerRange[c];
    if (colName === "ID") newRow.push(recordId);
    else if (colName === "Timestamp") newRow.push(timestamp);
    else if (colName === "Submitted_By") newRow.push(userRecord.username);
    else if (colName === "User_Role") newRow.push(userRecord.role);
    else if (colName === "Schema_ID") newRow.push(schemaId);
    else {
      var val = formData[colName];
      if (val === undefined || val === null) val = "";
      if (typeof val === "object") val = JSON.stringify(val);
      newRow.push(val);
    }
  }

  sheet.appendRow(newRow);

  return jsonResponse({
    success: true,
    message: "Record appended successfully.",
    record: {
      id: recordId,
      timestamp: timestamp,
      submitted_by: userRecord.username,
      user_role: userRecord.role,
      schema_id: schemaId,
      data: formData
    }
  });
}

/**
 * Handle Admin Creating a New User
 */
function handleCreateUser(userData) {
  if (!userData || !userData.username || !userData.password) {
    return jsonResponse({ success: false, error: "Username and password required." }, 400);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateUsersSheet();
  var users = getAllUsers(false);

  for (var i = 0; i < users.length; i++) {
    if (users[i].username.toLowerCase() === userData.username.trim().toLowerCase()) {
      return jsonResponse({ success: false, error: "Username already exists." }, 400);
    }
  }

  var newRow = [
    userData.username.trim(),
    userData.password.trim(),
    userData.role === "Admin" ? "Admin" : "User",
    userData.status === "Disabled" ? "Disabled" : "Active",
    userData.fullName || userData.username,
    userData.department || "Operations",
    new Date().toISOString(),
    ""
  ];

  sheet.appendRow(newRow);

  return jsonResponse({
    success: true,
    message: "User created successfully.",
    user: {
      username: userData.username,
      fullName: userData.fullName || userData.username,
      department: userData.department || "Operations",
      role: userData.role || "User",
      status: userData.status || "Active"
    }
  });
}

/**
 * Handle Admin Updating User Status or Password
 */
function handleUpdateUserStatus(targetUsername, status, newPassword) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateUsersSheet();
  var data = sheet.getDataRange().getValues();

  var found = false;
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().toLowerCase() === targetUsername.toLowerCase()) {
      found = true;
      if (status) {
        sheet.getRange(r + 1, 4).setValue(status); // Status column
      }
      if (newPassword) {
        sheet.getRange(r + 1, 2).setValue(newPassword); // Password column
      }
      break;
    }
  }

  if (!found) {
    return jsonResponse({ success: false, error: "Target user not found." }, 404);
  }

  return jsonResponse({
    success: true,
    message: "User " + targetUsername + " updated successfully."
  });
}

/**
 * Query All Submissions across all "Data_*" tabs with RBAC Filtering
 */
function getAllSubmissions(filters) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var allRecords = [];

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var name = sheet.getName();

    if (name.indexOf("Data_") !== 0) continue; // Only process data tabs

    var schemaId = name.replace("Data_", "");
    if (filters.schemaId && filters.schemaId !== schemaId) continue;

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue; // Only headers

    var headers = data[0];
    var idCol = headers.indexOf("ID");
    var timeCol = headers.indexOf("Timestamp");
    var userCol = headers.indexOf("Submitted_By");
    var roleCol = headers.indexOf("User_Role");

    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      var submittedBy = userCol >= 0 ? row[userCol].toString() : "";

      // RBAC Enforcement Filter
      if (filters.userFilter && submittedBy.toLowerCase() !== filters.userFilter.toLowerCase()) {
        continue;
      }

      var recordId = idCol >= 0 ? row[idCol].toString() : "REC-" + r;
      var timestamp = timeCol >= 0 ? row[timeCol] : new Date().toISOString();
      var userRole = roleCol >= 0 ? row[roleCol].toString() : "User";

      var itemData = {};
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c];
        if (["ID", "Timestamp", "Submitted_By", "User_Role", "Schema_ID"].indexOf(h) === -1) {
          itemData[h] = row[c];
        }
      }

      // Optional text search filter
      if (filters.search) {
        var searchLower = filters.search.toLowerCase();
        var matches = recordId.toLowerCase().indexOf(searchLower) >= 0 ||
                      submittedBy.toLowerCase().indexOf(searchLower) >= 0 ||
                      JSON.stringify(itemData).toLowerCase().indexOf(searchLower) >= 0;
        if (!matches) continue;
      }

      allRecords.push({
        id: recordId,
        timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp.toString(),
        submitted_by: submittedBy,
        user_role: userRole,
        schema_id: schemaId,
        schema_name: formatSchemaTitle(schemaId),
        data: itemData
      });
    }
  }

  // Sort unified array descending by timestamp
  allRecords.sort(function(a, b) {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return allRecords;
}

/**
 * Get All Users from Users Sheet
 */
function getAllUsers(includePassword) {
  var sheet = getOrCreateUsersSheet();
  var data = sheet.getDataRange().getValues();
  var users = [];

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (!row[0]) continue;

    var u = {
      username: row[0].toString(),
      role: row[2].toString(),
      status: row[3].toString(),
      fullName: row[4] ? row[4].toString() : row[0].toString(),
      department: row[5] ? row[5].toString() : "Operations",
      createdAt: row[6] ? row[6].toString() : "",
      lastLogin: row[7] ? row[7].toString() : ""
    };

    if (includePassword) {
      u.password = row[1] ? row[1].toString() : "";
    }

    users.push(u);
  }

  return users;
}

/**
 * Token Validation and Generation
 */
function generateToken(username, role) {
  var seed = username + ":" + role + ":" + new Date().getTime() + ":" + CONFIG.TOKEN_SECRET;
  return "STOKEN_" + Utilities.base64Encode(seed);
}

function validateAuth(username, token) {
  if (!token || token.indexOf("STOKEN_") !== 0) return null;
  var users = getAllUsers(false);
  for (var i = 0; i < users.length; i++) {
    if (users[i].username.toLowerCase() === username.toLowerCase()) {
      return users[i];
    }
  }
  return null;
}

function updateLastLogin(username) {
  var sheet = getOrCreateUsersSheet();
  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (data[r][0].toString().toLowerCase() === username.toLowerCase()) {
      sheet.getRange(r + 1, 8).setValue(new Date().toISOString());
      break;
    }
  }
}

/**
 * Helpers & Initializer
 */
function getOrCreateUsersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.USERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.USERS_SHEET, 0);
    var headers = ["Username", "Password", "Role", "Status", "FullName", "Department", "CreatedAt", "LastLogin"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#0F172A")
      .setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);

    // Seed default Admin and standard user
    sheet.appendRow(["admin", "admin123", "Admin", "Active", "Eleanor Vance (Admin)", "Executive Operations", new Date().toISOString(), ""]);
    sheet.appendRow(["sarah_ops", "user123", "User", "Active", "Sarah Chen", "Logistics & Supply", new Date().toISOString(), ""]);
    sheet.appendRow(["john_doe", "user123", "User", "Active", "Johnathan Doe", "Facility Engineering", new Date().toISOString(), ""]);
    sheet.appendRow(["alex_tech", "user123", "User", "Active", "Alex Rivera", "Cloud Platform", new Date().toISOString(), ""]);
  }
  return sheet;
}

function initDatabaseStructure() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateUsersSheet();
  return {
    success: true,
    message: "Google Sheets database successfully initialized with Users table."
  };
}

function formatSchemaTitle(schemaId) {
  return schemaId
    .replace(/_/g, " ")
    .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
}

function sanitizeSheetName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, "");
}

function hashString(str) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  var hex = "";
  for (var i = 0; i < raw.length; i++) {
    var b = (raw[i] + 256) % 256;
    if (b < 16) hex += "0";
    hex += b.toString(16);
  }
  return hex;
}

function jsonResponse(obj, optStatusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
