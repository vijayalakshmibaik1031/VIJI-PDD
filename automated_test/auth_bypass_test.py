from common import *


def run():
    config = load_config()
    data = load_discovered_endpoints()
    roles = bootstrap_roles(config["base_url"], config["input"])
    accounts = bootstrap_employees(config["base_url"], count=6)
    records = []
    for endpoint in data:
        method = endpoint["method"].upper()
        path = endpoint["path"]
        if is_public_endpoint(method, path):
            continue
        if path == "/api/employees/login" or path == "/api/managers/login" or path == "/api/authorities/login":
            continue
        for variant, _ in PROTECTED_AUTH_VARIANTS:
            headers = request_variants({}, None, variant)
            url = config["base_url"] + path.replace(":id", "sample-id").replace(":employeeId", accounts[0]["id"])
            response = request_json(method, url, headers=headers, body={}, timeout=20)
            if not expected_json_response(response):
                records.append(build_record(path, method, "unauthenticated", response.get("status", 0), 0, "", "Low", response.get("response_time_ms", 0), "auth_bypass", note_if_not_api(response, path)))
                continue
            finding, severity = classify_finding(response.get("ok"), response.get("status", 0), 401, f"Auth bypass on {method} {path} with {variant}")
            records.append(build_record(path, method, "unauthenticated", response.get("status", 0), 401, finding, severity, response.get("response_time_ms", 0), "auth_bypass", response_note(response)))
    return records
