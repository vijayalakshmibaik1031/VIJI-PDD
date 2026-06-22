from common import *


def run():
    config = load_config()
    roles = bootstrap_roles(config["base_url"], config["input"])
    employees = bootstrap_employees(config["base_url"], count=6)
    records = []
    target_urls = [
        ("GET", "/api/complaints/rejection-count?employeeId={}&roomId={}&category={}", [employees[0]["id"], "R1", "facility"]),
        ("GET", "/api/complaints/has-recomplained?employeeId={}&roomId={}&category={}", [employees[0]["id"], "R1", "facility"]),
        ("GET", f"/api/complaints/{employees[0]['id']}", []),
    ]
    for method, path_tpl, args in target_urls:
        for payload in INJECTION_PAYLOADS:
            if args:
                url = config["base_url"] + path_tpl.format(payload, payload, payload)
            else:
                url = config["base_url"] + path_tpl.replace(employees[0]["id"], payload)
            response = request_json(method, url, headers=bearer_headers(roles["manager"]["token"]), timeout=20)
            if not expected_json_response(response):
                records.append(build_record(path_tpl, method, "manager", response.get("status", 0), 0, "", "Low", response.get("response_time_ms", 0), "injection", note_if_not_api(response, path_tpl)))
                continue
            finding = ""
            severity = "Low"
            if response.get("status", 0) >= 500:
                finding = f"Server error on payload {payload}"
                severity = "Medium"
            elif "stack" in (response.get("body") or "").lower():
                finding = f"Stack trace leak on payload {payload}"
                severity = "High"
            records.append(build_record(path_tpl, method, "manager", response.get("status", 0), 400, finding, severity, response.get("response_time_ms", 0), "injection", response_note(response)))
    return records
