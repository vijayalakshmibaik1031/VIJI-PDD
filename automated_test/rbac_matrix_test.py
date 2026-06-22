from common import *


def run():
    config = load_config()
    endpoints = load_discovered_endpoints()
    roles = bootstrap_roles(config["base_url"], config["input"])
    accounts = bootstrap_employees(config["base_url"], count=6)
    records = []
    for endpoint in endpoints:
        method = endpoint["method"].upper()
        path = endpoint["path"]
        if not endpoint.get("roles"):
            continue
        if path.startswith("/api/complaints/employee/"):
            path = path.replace(":employeeId", accounts[0]["id"])
        elif ":id" in path:
            path = path.replace(":id", "sample-id")
        for role_name, role_data in roles.items():
            headers = bearer_headers(role_data["token"])
            body = {}
            if method == "POST" and path == "/api/complaints":
                body = complaint_payload(accounts[0])
            elif method == "POST" and path == "/api/merged-groups/:id/endorse":
                body = {"employeeId": accounts[0]["id"]}
            elif method == "PATCH" and path == "/api/complaints/:id/status":
                body = {"status": "open"}
            elif method == "PATCH" and path == "/api/complaints/:id/reject":
                body = {"reason": "test reason"}
            elif method == "PATCH" and path == "/api/complaints/:id/escalate":
                body = {"reason": "test escalation"}
            elif method == "PATCH" and path == "/api/merged-groups/:id/escalate":
                body = {"escalationNote": "test"}
            elif method == "PATCH" and path == "/api/merged-groups/:id/acknowledge":
                body = {}
            url = config["base_url"] + path
            response = request_json(method, url, headers=headers, body=body, timeout=20)
            if not expected_json_response(response):
                records.append(build_record(endpoint["path"], method, role_name, response.get("status", 0), 0, "", "Low", response.get("response_time_ms", 0), "rbac_matrix", note_if_not_api(response, endpoint["path"])))
                continue
            allowed = endpoint.get("roles", [])
            expected = 200 if role_name in allowed or "any" in allowed or (role_name == "manager" and (method, endpoint["path"]) in ROLE_ENDPOINTS["manager"]) else 403
            finding, severity = classify_finding(response.get("ok"), response.get("status", 0), expected, f"RBAC issue on {method} {endpoint['path']} for {role_name}")
            records.append(build_record(endpoint["path"], method, role_name, response.get("status", 0), expected, finding, severity, response.get("response_time_ms", 0), "rbac_matrix", response_note(response)))
    return records
