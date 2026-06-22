from common import *


def run():
    config = load_config()
    records = []
    for idx in range(30):
        response = request_json("POST", config["base_url"] + "/api/employees/login", body={"userId": f"rate-{idx}", "password": "x"}, timeout=20)
        finding = ""
        severity = "Low"
        if response.get("status") != 429 and idx >= 20:
            finding = "No rate limiting detected on login endpoint"
            severity = "Medium"
        records.append(build_record("/api/employees/login", "POST", "public", response.get("status", 0), 401 if idx < 20 else 429, finding, severity, response.get("response_time_ms", 0), "rate_limit", response_note(response)))
        time.sleep(0.1)
    return records
