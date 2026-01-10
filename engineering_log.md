# Engineering Log - Campus Eats Rebuild

**Status:** Active
**Started:** Day 1

## A. Error Log
| Day | File | Error | Root Cause | Fix Applied |
|-----|------|-------|------------|-------------|
| 1 | N/A | Expo Dependencies detected in `mobile` package.json | Legacy codebase was built on Expo. | **DELETION REQUIRED:** Must destroy legacy dependency tree or init fresh CLI project. |
| 1 | N/A | Appwrite dependency in Backend | Legacy backend used Appwrite as DB. | **DELETION REQUIRED:** Replacing with manual PostgreSQL + FastAPI implementation. |
| 1 | `backend/requirements.txt` | `externally-managed-environment` (pip install failed) | macOS System Python restrictions. | **FIX:** Created `venv` at `backend/venv`. Always use `backend/venv/bin/python` or `pip`. |
| 1 | `pydantic-core` | `Failed to build wheel` (Rust not found) | System is using Python 3.14 (Alpha). No wheels available. | **FIX:** Must use stable Python (3.11/3.12) or install Rust. Attempting to switch Python version. |
| 1 | `psycopg2-binary` | `C-API Incompatibility` (Python 3.14) | Python 3.14 Alpha breaks legacy C extensions. | **FIX:** Switched to `pg8000` (Pure Python driver) to ensure compatibility. |
| 1 | `fastapi` | `ConfigError` (Pydantic V1 + Py3.14) | FastAPI 0.104+ issues with Pydantic V1 on Py3.14. | **FIX:** Downgraded to `fastapi==0.95.2` (Pure Pydantic V1 era). **FAILED:** Issue persists on Py3.14. Must enable Rust/Pydantic V2. |
| 1 | `rust` | `No such file or directory` (Homebrew) | Homebrew cache corruption. | **FIX:** Ran `brew cleanup && brew install rust`. Installed successfully. Retrying Backend V2. |
| 1 | `pydantic-core` | `maturin` build failed (Py3.14) | Python 3.14 Alpha is too new for current Rust crates. | **FIX:** Installing stable `python@3.12` via Homebrew and rebuilding `backend/venv`. |

## B. Fix Log
> Solutions that worked. Reference this before debugging.

### [Topic] Issue Name
- **Context:**
### [Architecture] Manual Payment Proof (Day 4)
- **Context:** User rejected "Mock Verification". Required strict Admin control.
- **Fix:** Implemented `payment_submitted` boolean flag. Student actions NEVER change order status. Only Admin API changes status.

### [Mobile] NDK Installation Hang
- **Context:** `npm run android` hangs at "50% Configuring" for 5-10 mins.
- **Fix:** Normal behavior. It downloads the Android NDK (1GB). DO NOT CANCEL. Wait it out.

## C. Deletion Log
> Files and dependencies removed to meet constraints (Speed, Size, Architecture).

| Date | File/Dependency | Reason | Safe/Destructive |
|------|----------------|--------|------------------|
| Day 1 | `backend_python/` | Legacy Appwrite wrapper. Violates "PostgreSQL" constraint. | **Destructive** (Replaced by new `backend/`) |
| Day 1 | `*.md` Reports | Obsolete analysis files (`architecture_report.md` etc). | **Safe** (Cleanup) |

## D. Prevention Notes
- **NO Zustand**: Violates "Thin Client" and "Minimal Dependency". Use `Context` + `useReducer` for Cart.
- **NO Swipe Gestures**: Operational Hazard (Wet hands/Gloves). Use **Big Buttons** + **Confirm Dialogs**.
- **NO SSE-Only**: Unreliable on bad networks. Use **Polling** (15s) as primary, SSE as bonus.
- **APK Size**: Must be ≤ 20 MB. No bundled assets, no heavy libs.
- **APK Size**: Must be ≤ 20 MB. No bundled assets, no heavy libs.
- **Do NOT use Expo libraries** (e.g. `expo-font`) unless using Unimodules in Bare workflow is allowed. Prefer `react-native-*` CLI native libraries.
- **Strict Status Control**: Student NEVER changes status. Admin ONLY.

## E. Execution Log (Strict Hardening)
| Date | Item | Decision / Change | Reason |
|------|------|-------------------|--------|
| Day 12 | `mobile_legacy` | **MOVED to Archive** (Not Deleted) | Preserve Engineering Memory per Lead Engineer. |
| Day 12 | Payment Flow | **Enforced UTR Only** | Images/Screenshots create operational chaos. |
| Day 12 | Payment UI | **Added Token # Display** | Immediate reassurance for student. |
| Day 12 | Payment Backend | **Added Duplicate UTR Check** | Prevent fraud/double-spending. |
| Day 12 | Mobile Config | **Verified Hermes/ProGuard** | Ensure APK size ≤ 20 MB. |
| Day 12 | Gateway | **Deferred** | Settings placeholder only. No implementation. |
