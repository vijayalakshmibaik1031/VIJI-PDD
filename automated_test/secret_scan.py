from common import *


def run():
    findings = scan_secrets()
    records = []
    for item in findings:
        records.append(build_record(item["file"], "SCAN", "n/a", 0, 0, f"Potential secret pattern in {item['file']}", "High", 0, "secret_scan", item["secret_value"]))
    return records
