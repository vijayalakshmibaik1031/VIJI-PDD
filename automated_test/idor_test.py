from common import *


def run():
    config = load_config()
    roles = bootstrap_roles(config["base_url"], config["input"])
    employees = bootstrap_employees(config["base_url"], count=6)
    records = []
    owner = employees[0]
    comp = create_complaint(config["base_url"], owner["token"], complaint_payload(owner, "idor-owner"))
    for role in employees[1:3]:
        tests = [
            ("GET", f"/api/complaints/{random_id('other')}", {}),
            ("GET", f"/api/complaints/{owner['id']}", {}),
            ("GET", f"/api/complaints/employee/{owner['id']}", {}),
        ]
        for method, path, body in tests:
            url = config["base_url"] + path
            response = request_json(method, url, headers=bearer_headers(role["token"]), body=body, timeout=20)
            finding = ""
            severity = "Low"
            if not expected_json_response(response):
                records.append(build_record(path, method, role["role"], response.get("status", 0), 0, "", "Low", response.get("response_time_ms", 0), "idor", note_if_not_api(response, path)))
                continue
            if response.get("status", 0) in (200, 201) and path.endswith(owner["id"]):
                finding = f"Potential IDOR on {path}"
                severity = "High"
            records.append(build_record(path, method, role["role"], response.get("status", 0), 403 if path.endswith(owner["id"]) else 404, finding, severity, response.get("response_time_ms", 0), "idor", response_note(response)))
    return records
