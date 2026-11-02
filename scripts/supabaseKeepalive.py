#!/usr/bin/env python3
"""
Supabase Health Watchdog & Keepalive Engine for Damsel & Desire
Prevents 7-day Free Tier auto-pause by performing periodic database query heartbeats,
and automatically restores the project via Supabase Management API if found INACTIVE.
"""

import json
import os
import sys
import urllib.request
import urllib.error

SUPABASE_URL = "https://oavkhnjigdqacvqfkzpf.supabase.co"
SUPABASE_KEY = "sb_publishable_M_ZCTbtu0UYlfiAyLON_2Q_jYWHAiPI"
PROJECT_ID = "oavkhnjigdqacvqfkzpf"

TOKEN_PATHS = [
    os.path.expanduser("~/.hermes/profiles/alex-bardot/mcp-tokens/supabase.json"),
    os.path.expanduser("~/.supabase/access_token"),
]

def get_management_token() -> str:
    for path in TOKEN_PATHS:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content.startswith("{"):
                        data = json.loads(content)
                        token = data.get("access_token")
                        if token:
                            return token
                    elif content:
                        return content
            except Exception:
                pass
    return os.environ.get("SUPABASE_ACCESS_TOKEN", "")

def ping_rest_api() -> bool:
    """Sends a real database query to reset Supabase 7-day inactivity timer."""
    endpoint = f"{SUPABASE_URL}/rest/v1/school_calendar_state?select=count"
    req = urllib.request.Request(
        endpoint,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "User-Agent": "DamselDesireKeepalive/1.0"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status == 200:
                print("✓ [KEEPALIVE OK] REST API query executed (HTTP 200). 7-day inactivity timer reset.")
                return True
    except urllib.error.HTTPError as e:
        print(f"⚠️ [PING HTTP ERROR] Status {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        print(f"⚠️ [PING NETWORK ERROR] {e.reason}")
    except Exception as e:
        print(f"⚠️ [PING ERROR] {e}")
    return False

def inspect_and_restore_project() -> bool:
    """Inspects project status via Management API and wakes it up if paused."""
    token = get_management_token()
    if not token:
        print("❌ [RESTORE ABORTED] No management auth token found to auto-restore.")
        return False

    status_url = f"https://api.supabase.com/v1/projects/{PROJECT_ID}"
    req = urllib.request.Request(
        status_url,
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            status = data.get("status", "UNKNOWN")
            print(f"ℹ️ [MANAGEMENT STATUS] Project status: {status}")

            if status in ["INACTIVE", "PAUSED"]:
                print("🚨 [PROJECT PAUSED] Database is inactive. Triggering automatic restore...")
                restore_url = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/restore"
                restore_req = urllib.request.Request(
                    restore_url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    },
                    data=b"{}",
                    method="POST"
                )
                with urllib.request.urlopen(restore_req, timeout=15) as r_resp:
                    res = json.loads(r_resp.read().decode("utf-8"))
                    print(f"✓ [AUTO-RESTORE SUCCESS] {res}. Project is booting up (COMING_UP).")
                    return True
            elif status == "ACTIVE_HEALTHY":
                print("✓ Project is already ACTIVE_HEALTHY.")
                return True
            else:
                print(f"⏳ Project is currently in transition state: {status}")
                return True
    except Exception as e:
        print(f"❌ [MANAGEMENT API ERROR] {e}")
        return False

def main():
    print("=" * 60)
    print("Damsel & Desire — Supabase Keepalive Watchdog")
    print("=" * 60)

    # Step 1: Ping REST API to reset inactivity timer
    if ping_rest_api():
        sys.exit(0)

    # Step 2: If ping failed, check project status and auto-unpause
    print("Database unreachable or paused. Checking Management API...")
    if inspect_and_restore_project():
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
