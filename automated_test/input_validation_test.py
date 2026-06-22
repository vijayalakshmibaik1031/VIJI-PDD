from common import *


def run():
    config = load_config()
    roles = bootstrap_roles(config["base_url"], config["input"])
    records = []
    variations = [None, "", "A" * 1024, "東京", -1, 10**18, "!@#"]
    for value in variations:
        body = {"userId": value, "password": value}
        response = request_json("POST", config["base_url"] + "/api/employees/login", body=body, timeout=20)
        finding = ""
        severity = "Low"
        if response.get("status", 0) >= 500:
            finding = f"Validation failure on value {redact_value(value)}"
            severity = "Medium"
        records.append(build_record("/api/employees/login", "POST", "public", response.get("status", 0), 400, finding, severity, response.get("response_time_ms", 0), "input_validation", response_note(response)))
    return records
