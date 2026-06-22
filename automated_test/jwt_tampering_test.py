from common import *


def run():
    config = load_config()
    roles = bootstrap_roles(config["base_url"], config["input"])
    token = roles["employee"]["token"]
    tampered = [
        token + "x",
        token.replace("a", "b", 1) if token else "tampered.token.value",
        random_token_like(),
    ]
    endpoints = ["/api/complaints", "/api/complaints/rejection-count", "/api/merged-groups"]
    records = []
    for path in endpoints:
        for value in tampered:
            response = request_json("GET", config["base_url"] + path, headers={"Authorization": f"Bearer {value}"}, timeout=20)
            if not expected_json_response(response):
                records.append(build_record(path, "GET", "tampered", response.get("status", 0), 0, "", "Low", response.get("response_time_ms", 0), "jwt_tampering", note_if_not_api(response, path)))
                continue
            finding, severity = classify_finding(response.get("ok"), response.get("status", 0), 401, f"JWT tampering accepted on {path}")
            records.append(build_record(path, "GET", "tampered", response.get("status", 0), 401, finding, severity, response.get("response_time_ms", 0), "jwt_tampering", response_note(response)))
    return records
