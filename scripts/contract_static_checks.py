from pathlib import Path

source = Path("contracts/driftglass.py").read_text()
required = [
    "gl.vm.run_nondet_unsafe", "def validator_fn", "source_commitments", "_grounded",
    "@gl.public.write", "@gl.public.view", "checkpoint_eligible",
]
missing = [item for item in required if item not in source]
if missing:
    raise SystemExit(f"contract checks failed; missing: {', '.join(missing)}")
print("contract static checks passed")
