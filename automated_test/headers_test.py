from common import *


def run():
    config = load_config()
    endpoints = [("GET", "/"), ("GET", "/api/employees/login")]
    records = []
    for method, path in endpoints:
        response = request_json(method, config["base_url"] + path, timeout=20)
        headers = response.get("headers", {})
        missing = [name for name in SECURITY_HEADERS if name not in headers]
        finding = ""
        severity = "Low"
        if missing:
            finding = f"Missing security headers: {', '.join(missing)}"
            severity = "Medium"
        records.append(build_record(path, method, "public", response.get("status", 0), 200, finding, severity, response.get("response_time_ms", 0), "headers", response_note(response)))
    return records
