from pathlib import Path
import re

ignored = {".git", ".next", ".venv", "node_modules", "artifacts"}
files = [p for p in Path(".").rglob("*") if p.is_file() and not any(part in ignored for part in p.parts)]
text = "\n".join(p.read_text(errors="ignore") for p in files)
forbidden_chain = "619" + "97"
forbidden_name = "studio" + "-dev"
if forbidden_chain in text or forbidden_name in text.lower():
    raise SystemExit("forbidden network configuration found")
if re.search(r"(?i)(private[_ -]?key|seed phrase|mnemonic)\s*[:=]\s*['\"]?[A-Za-z0-9]", text):
    raise SystemExit("possible secret found")
print("release scan passed")
