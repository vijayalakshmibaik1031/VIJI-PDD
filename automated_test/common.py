import base64
import json
import os
import random
import re
import ssl
import string
import subprocess
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DEFAULT_BASE_URL = "https://triumphant-grace-production.up.railway.app"
INPUT_FILE = BASE_DIR / "input.json"
DISCOVERY_FILE = BASE_DIR / "discovered-endpoints.json"
REPORT_FILE = BASE_DIR / "report.json"
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = True
SSL_CTX.verify_mode = ssl.CERT_REQUIRED

PROTECTED_AUTH_VARIANTS = [
    ("no token", None),
    ("empty token", ""),
    ("invalid token", "invalid-token-"),
    ("malformed jwt", "abc.def"),
    ("expired jwt", "eyJhbGciOiJub25lIn0.eyJleHAiOjEwMDB9.sig"),
    ("random string token", None),
    ("modified signature", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkYXN0In0.changed"),
    ("bearer null", "null"),
    ("bearer undefined", "undefined"),
    ("wrong content type", "wrong-content-type"),
]

INJECTION_PAYLOADS = [
    "''",
    '"',
    "' OR '1'='1",
    "admin'--",
    "${7*7}",
    "{{7*7}}",
    "$ne",
    "$gt",
    "../../etc/passwd",
    "<svg/onload=alert(1)>",
]

VALIDATION_CASES = [
    ("empty", ""),
    ("null", None),
    ("long", "A" * 2048),
    ("unicode", "東京-Δ-🚧"),
    ("negative", -1),
    ("huge", 10**18),
    ("special", "!@#$%^&*()_+<>?;:[]{}|\\")
]

SECURITY_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
]

ROLE_ENDPOINTS = {
    "employee": {
        ("POST", "/api/complaints"),
        ("GET", "/api/complaints/employee/:employeeId"),
        ("POST", "/api/complaints/mark-recomplained"),
        ("POST", "/api/merged-groups/:id/endorse"),
    },
    "manager": {
        ("GET", "/api/complaints"),
        ("PATCH", "/api/complaints/:id/status"),
        ("PATCH", "/api/complaints/:id/complete"),
        ("PATCH", "/api/complaints/:id/reject"),
        ("PATCH", "/api/complaints/:id/escalate"),
        ("POST", "/api/merged-groups"),
        ("PATCH", "/api/merged-groups/:id/escalate"),
    },
    "authority": {
        ("GET", "/api/authorities"),
        ("PATCH", "/api/merged-groups/:id/acknowledge"),
        ("GET", "/api/complaints"),
    },
}

PUBLIC_ENDPOINTS = {
    ("GET", "/"),
    ("GET", "/test-db"),
    ("POST", "/api/employees/register"),
    ("POST", "/api/employees/login"),
    ("POST", "/api/managers/register"),
    ("POST", "/api/managers/login"),
    ("POST", "/api/authorities/register"),
    ("POST", "/api/authorities/login"),
}

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def load_json(path):
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))

def save_json(path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

def load_config():
    data = load_json(INPUT_FILE) or {}
    base_url = data.get("baseUrl") or DEFAULT_BASE_URL
    if base_url.startswith("http://localhost") or base_url.startswith("http://127.0.0.1"):
        base_url = DEFAULT_BASE_URL
    return {
        "base_url": base_url.rstrip("/"),
        "input": data,
    }

def load_discovered_endpoints():
    data = load_json(DISCOVERY_FILE)
    if isinstance(data, list) and data:
        return data
    return [
        {"method": method, "path": path, "auth": "public", "roles": []}
        for method, path in sorted(PUBLIC_ENDPOINTS)
    ]

def canonical_path(path):
    return path.replace(":id", ":id").replace(":employeeId", ":employeeId")

def endpoint_key(method, path):
    return (method.upper(), canonical_path(path))

def is_public_endpoint(method, path):
    return endpoint_key(method, path) in PUBLIC_ENDPOINTS

def is_role_endpoint(method, path, role):
    return endpoint_key(method, path) in ROLE_ENDPOINTS.get(role, set())

def pretty_role_name(role):
    return role.title()

def random_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:12]}"

def random_token_like():
    parts = [
        base64.urlsafe_b64encode(os.urandom(9)).decode().rstrip("="),
        base64.urlsafe_b64encode(os.urandom(12)).decode().rstrip("="),
        base64.urlsafe_b64encode(os.urandom(9)).decode().rstrip("=")
    ]
    return ".".join(parts)

def make_request(method, url, headers=None, body=None, timeout=20):
    request_headers = {"User-Agent": "FacilityDesk-DAST/1.0"}
    if headers:
        request_headers.update(headers)
    data = None
    if body is not None:
        if isinstance(body, (dict, list)):
            data = json.dumps(body).encode("utf-8")
            request_headers.setdefault("Content-Type", "application/json")
        elif isinstance(body, bytes):
            data = body
        else:
            data = str(body).encode("utf-8")
    req = Request(url, data=data, headers=request_headers, method=method.upper())
    started = time.perf_counter()
    try:
        with urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            elapsed = int((time.perf_counter() - started) * 1000)
            raw = resp.read()
            return {
                "ok": True,
                "status": resp.status,
                "headers": dict(resp.headers.items()),
                "body": raw.decode("utf-8", errors="replace"),
                "response_time_ms": elapsed,
            }
    except HTTPError as err:
        elapsed = int((time.perf_counter() - started) * 1000)
        try:
            body_text = err.read().decode("utf-8", errors="replace")
        except Exception:
            body_text = ""
        return {
            "ok": False,
            "status": err.code,
            "headers": dict(getattr(err, "headers", {}).items()) if getattr(err, "headers", None) else {},
            "body": body_text,
            "response_time_ms": elapsed,
            "error": str(err),
        }
    except URLError as err:
        elapsed = int((time.perf_counter() - started) * 1000)
        return {
            "ok": False,
            "status": 0,
            "headers": {},
            "body": "",
            "response_time_ms": elapsed,
            "error": str(err.reason),
        }

def request_json(method, url, headers=None, body=None, timeout=20):
    response = make_request(method, url, headers=headers, body=body, timeout=timeout)
    parsed = None
    if response.get("body"):
        try:
            parsed = json.loads(response["body"])
        except json.JSONDecodeError:
            parsed = None
    response["json"] = parsed
    return response

def bearer_headers(token):
    return {"Authorization": f"Bearer {token}"}

def extract_token(response):
    payload = response.get("json") or {}
    token = payload.get("token")
    if token:
        return token
    if isinstance(payload.get("session"), dict):
        token = payload["session"].get("token")
        if token:
            return token
    return None

def login_role(base_url, role, user_id, password):
    url_map = {
        "employee": ("/api/employees/register", "/api/employees/login"),
        "manager": ("/api/managers/register", "/api/managers/login"),
        "authority": ("/api/authorities/register", "/api/authorities/login"),
    }
    register_path, login_path = url_map[role]
    register_url = urljoin(base_url + "/", register_path.lstrip("/"))
    login_url = urljoin(base_url + "/", login_path.lstrip("/"))
    register_body = {"id": user_id, "name": user_id, "password": password}
    register = request_json("POST", register_url, body=register_body, timeout=20)
    login = request_json("POST", login_url, body={"userId": user_id, "password": password}, timeout=20)
    token = extract_token(login)
    if not token:
        token = extract_token(register)
    return {
        "role": role,
        "id": user_id,
        "password": password,
        "register": register,
        "login": login,
        "token": token,
    }

def bootstrap_roles(base_url, input_data):
    roles = {}
    seed_map = {
        "employee": input_data.get("employee") or "",
        "manager": input_data.get("manager") or "",
        "authority": input_data.get("authority") or "",
    }
    for role in ("employee", "manager", "authority"):
        supplied = seed_map[role]
        if isinstance(supplied, dict):
            token = supplied.get("token") or supplied.get("accessToken") or ""
        else:
            token = str(supplied).strip()
        if token:
            roles[role] = {"role": role, "id": None, "password": None, "token": token, "source": "input.json"}
        else:
            user_id = random_id(f"dast-{role}")
            password = f"{role}Pass!{uuid.uuid4().hex[:8]}"
            roles[role] = login_role(base_url, role, user_id, password)
            roles[role]["source"] = "bootstrap"
    return roles

def bootstrap_employees(base_url, count=6):
    accounts = []
    for idx in range(count):
        user_id = random_id(f"dast-employee-{idx+1}")
        password = f"employeePass!{uuid.uuid4().hex[:8]}"
        accounts.append(login_role(base_url, "employee", user_id, password))
    return accounts

def complaint_payload(employee, suffix=None):
    suffix = suffix or uuid.uuid4().hex[:8]
    return {
        "id": f"complaint-{suffix}",
        "employeeId": employee["id"],
        "employeeName": employee["id"],
        "roomId": f"R{random.randint(100, 999)}",
        "category": "facility",
        "description": f"DAST complaint {suffix}",
        "completionPhotoUri": None,
        "parentComplaintId": None,
    }

def create_complaint(base_url, token, payload):
    url = urljoin(base_url + "/", "api/complaints")
    return request_json("POST", url, headers=bearer_headers(token), body=payload, timeout=20)

def create_merged_group(base_url, token, complaint_ids, room_id, category):
    url = urljoin(base_url + "/", "api/merged-groups")
    payload = {
        "id": f"group-{uuid.uuid4().hex[:10]}",
        "roomId": room_id,
        "category": category,
        "managerDescription": "DAST merge test",
        "complaintIds": complaint_ids,
    }
    return request_json("POST", url, headers=bearer_headers(token), body=payload, timeout=20), payload["id"]

def redact_value(value):
    if value is None:
        return None
    text = str(value)
    if len(text) <= 8:
        return text[:2] + "***"
    return text[:4] + "***" + text[-4:]

def response_note(response):
    body = response.get("body") or ""
    if not body:
        return ""
    snippet = body[:220]
    if len(body) > 220:
        snippet += "..."
    return snippet.replace("\n", " ")


def looks_like_html_fallback(response):
    headers = {k.lower(): v for k, v in (response.get("headers") or {}).items()}
    content_type = headers.get("content-type", "").lower()
    body = (response.get("body") or "").lstrip().lower()
    return "text/html" in content_type or body.startswith("<!doctype html") or body.startswith("<html")


def expected_json_response(response):
    return not looks_like_html_fallback(response)

def build_record(endpoint, method, role, status, expected_status, finding, severity, response_time_ms, test_category, note):
    return {
        "endpoint": endpoint,
        "method": method,
        "role": role,
        "status": status,
        "expected_status": expected_status,
        "finding": finding,
        "severity": severity,
        "response_time_ms": response_time_ms,
        "test_category": test_category,
        "note": note,
        "timestamp": now_iso(),
    }

def classify_finding(ok, status, expected, message, high_on_2xx=True):
    if status == expected:
        return "", "Low"
    if status in (200, 201, 202, 204) and high_on_2xx:
        return message or f"Unexpected {status} response", "High"
    if status == 429:
        return "", "Info"
    if status >= 500:
        return message or "Server error", "Medium"
    if status in (401, 403, 404):
        return "", "Low"
    return message or f"Unexpected {status} response", "Medium"


def note_if_not_api(response, endpoint):
    if looks_like_html_fallback(response):
        return f"{endpoint} returned HTML fallback; backend API not exposed at this path"
    return response_note(response)

def execute_cases(cases, max_workers=5):
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(case["fn"]) for case in cases]
        for future in as_completed(futures):
            results.append(future.result())
    return results

def load_report():
    if REPORT_FILE.exists():
        return json.loads(REPORT_FILE.read_text(encoding="utf-8"))
    return []

def write_report(records):
    save_json(REPORT_FILE, records)

def scan_secrets():
    patterns = [
        re.compile(r"JWT_SECRET\s*[:=]\s*([^\n\r]+)", re.I),
        re.compile(r"DATABASE_URL\s*[:=]\s*([^\n\r]+)", re.I),
        re.compile(r"API_KEY\s*[:=]\s*([^\n\r]+)", re.I),
        re.compile(r"ACCESS_KEY\s*[:=]\s*([^\n\r]+)", re.I),
        re.compile(r"PRIVATE_KEY\s*[:=]\s*([^\n\r]+)", re.I),
        re.compile(r"PASSWORD\s*[:=]\s*([^\n\r]+)", re.I),
    ]
    ignore_dirs = {
        ".git", "node_modules", "dist", "build", "coverage", "allure-results", "reports", "__pycache__", ".venv", "venv",
        "automated_test", "appium-tests", "selenium-tests", "Vulnerability Test Results",
    }
    allowed_roots = {"backend", "web-admin"}
    ignored_values = {"man123", "auth123", "manager", "auth", "password", "123456", "changeme", "test", "demo"}
    findings = []
    for path in ROOT_DIR.rglob("*"):
        if any(part in ignore_dirs for part in path.parts):
            continue
        if path.parts and path.parts[0] not in allowed_roots:
            continue
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".js", ".ts", ".py", ".json", ".md", ".yml", ".yaml", ".txt", ".env", ""}:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for pattern in patterns:
            for match in pattern.finditer(text):
                secret = match.group(1).strip().strip('"\'')
                if len(secret) < 12:
                    continue
                if secret.lower() in ignored_values:
                    continue
                findings.append({
                    "file": str(path.relative_to(ROOT_DIR)).replace("\\", "/"),
                    "secret_name": pattern.pattern.split("\\s*")[0],
                    "secret_value": redact_value(secret),
                })
    return findings

def request_variants(base_headers, token, variant):
    if variant == "no token":
        return {}
    if variant == "empty token":
        return {"Authorization": "Bearer "}
    if variant == "invalid token":
        return {"Authorization": "Bearer invalid-token-" + uuid.uuid4().hex[:6]}
    if variant == "malformed jwt":
        return {"Authorization": "Bearer abc.def"}
    if variant == "expired jwt":
        return {"Authorization": "Bearer eyJhbGciOiJub25lIn0.eyJleHAiOjEwMDB9.sig"}
    if variant == "random string token":
        return {"Authorization": f"Bearer {random_token_like()}"}
    if variant == "modified signature":
        return {"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkYXN0In0.changed"}
    if variant == "bearer null":
        return {"Authorization": "Bearer null"}
    if variant == "bearer undefined":
        return {"Authorization": "Bearer undefined"}
    if variant == "wrong content type":
        return {"Content-Type": "text/plain"}
    return {}
