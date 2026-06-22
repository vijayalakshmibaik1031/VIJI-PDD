from common import *


def run():
    config = load_config()
    origins = ["https://example.com", "https://evil.example", "null"]
    records = []
    for origin in origins:
        response = request_json("GET", config["base_url"] + "/", headers={"Origin": origin}, timeout=20)
        allow_origin = response.get("headers", {}).get("Access-Control-Allow-Origin")
        allow_creds = response.get("headers", {}).get("Access-Control-Allow-Credentials")
        finding = ""
        severity = "Low"
        if allow_origin == origin or (allow_origin == "*" and allow_creds == "true"):
            finding = f"CORS reflects or over-permits origin {origin}"
            severity = "Medium"
        records.append(build_record("/", "GET", "public", response.get("status", 0), 200, finding, severity, response.get("response_time_ms", 0), "cors", response_note(response)))
    return records
