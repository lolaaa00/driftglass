import json

import pytest


CONTRACT = "contracts/driftglass.py"
SDK_RELEASE = "v0.2.16"
SOURCE = "https://policy.example.org/terms"
AUTHORITY = "https://example.org/.well-known/driftglass.json"
BENEFICIARY = "0x1111111111111111111111111111111111111111"
RIGHT_LABEL = "Exercise the verified data-export right"
CONTENT = (
    "Official policy for Example Service. Customers may export all records at any time. "
    "The service gives 30 days notice before a material pricing change."
)
BASELINE = {
    "outcome": "VERIFIED",
    "clauses": [
        {
            "index": 0,
            "supported": True,
            "source_index": 0,
            "excerpt": "Customers may export all records at any time",
        }
    ],
    "reason": "The official policy directly supports the reliance clause.",
}
STABLE = {
    "outcome": "STABLE",
    "clauses": [
        {
            "index": 0,
            "verdict": "PRESERVED",
            "source_index": 0,
            "excerpt": "Customers may export all records at any time",
            "reason": "The practical export right is unchanged.",
        }
    ],
    "reason": "The frozen meaning remains materially preserved.",
}


def draft(contract, subject="Example Service data portability", beneficiary=BENEFICIARY):
    return contract.create_draft(
        subject,
        "example.org",
        [SOURCE],
        ["Customers may export all records at any time."],
        AUTHORITY,
        str(beneficiary),
        RIGHT_LABEL,
        300,
        "Relied upon by migration teams.",
    )


def mock_authority(vm, contract, watch_id="1", overrides=None):
    watch = load_watch(contract, watch_id)
    manifest = {
        "schema": "driftglass-authority-v1",
        "canonical_domain": watch["canonical_domain"],
        "issuer": watch["creator"].lower(),
        "beneficiary": watch["beneficiary"].lower(),
        "policy_digest": contract.get_policy_digest(watch_id),
    }
    manifest.update(overrides or {})
    vm.mock_web(r"example\.org/\.well-known/driftglass\.json", {"status": 200, "body": json.dumps(manifest)})


def mock_baseline(vm, contract, watch_id="1", content=CONTENT, result=BASELINE):
    vm.mock_web(r"policy\.example\.org/terms", {"status": 200, "body": content})
    mock_authority(vm, contract, watch_id)
    vm.mock_llm(r"verifying a proposed public-policy baseline", json.dumps(result))


def mock_checkpoint(vm, content=CONTENT, result=STABLE):
    vm.mock_web(r"policy\.example\.org/terms", {"status": 200, "body": content})
    vm.mock_llm(r"comparing current public-policy evidence", json.dumps(result))


def load_watch(contract, watch_id="1"):
    return json.loads(contract.get_watch(watch_id))


@pytest.mark.direct
def test_registration_activation_and_first_checkpoint(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    assert watch_id == "1"
    assert load_watch(contract)["lifecycle"] == "DRAFT"

    mock_baseline(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)
    active = load_watch(contract)
    assert active["lifecycle"] == "ACTIVE"
    assert active["active_revision"] == 1
    assert active["checkpoint_eligible"] is True
    revision = json.loads(contract.get_revisions(watch_id))[0]
    commitment = revision["verification"]["sources"][0]
    assert commitment["url"] == SOURCE
    assert len(commitment["content_sha256"]) == 64
    assert commitment["content_length"] == len(CONTENT)

    direct_vm.clear_mocks()
    mock_checkpoint(direct_vm)
    contract.run_checkpoint(watch_id)
    after = load_watch(contract)
    assert after["assessment"] == "STABLE"
    assert after["checkpoint_count"] == 1
    assert after["checkpoint_eligible"] is False
    assert after["fresh_until"] > after["last_checkpoint_at"]
    history = json.loads(contract.get_checkpoints(watch_id))
    assert history[0]["result"]["clauses"][0]["verdict"] == "PRESERVED"


@pytest.mark.direct
def test_validator_replays_substance_and_rejects_changed_evidence(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    mock_baseline(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)

    direct_vm.clear_mocks()
    direct_vm.mock_web(r"policy\.example\.org/terms", {"status": 200, "body": "Official policy now says exports are prohibited."})
    mock_authority(direct_vm, contract, watch_id)
    disagreement = {
        "outcome": "CLAUSE_NOT_SUPPORTED",
        "clauses": [{"index": 0, "supported": False, "source_index": 0, "excerpt": "exports are prohibited"}],
        "reason": "The clause is no longer supported.",
    }
    direct_vm.mock_llm(r"verifying a proposed public-policy baseline", json.dumps(disagreement))
    assert direct_vm.run_validator() is False


@pytest.mark.direct
def test_failed_baseline_stays_draft_and_can_be_retried(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    unsupported = {
        "outcome": "CLAUSE_NOT_SUPPORTED",
        "clauses": [{"index": 0, "supported": False, "source_index": 0, "excerpt": "30 days notice"}],
        "reason": "The evidence does not support the export clause.",
    }
    mock_baseline(direct_vm, contract, watch_id, result=unsupported)
    contract.activate_baseline(watch_id)
    first = load_watch(contract)
    assert first["lifecycle"] == "DRAFT"
    assert first["last_activation_result"]["outcome"] == "CLAUSE_NOT_SUPPORTED"

    direct_vm.clear_mocks()
    mock_baseline(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)
    assert load_watch(contract)["lifecycle"] == "ACTIVE"


@pytest.mark.direct
def test_unavailable_source_never_becomes_verified_or_fresh(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    direct_vm.mock_web(r"policy\.example\.org/terms", {"status": 503, "body": ""})
    mock_authority(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)
    result = load_watch(contract)
    assert result["lifecycle"] == "DRAFT"
    assert result["last_activation_result"]["outcome"] == "SOURCE_UNAVAILABLE"


@pytest.mark.direct
def test_unauthorized_edit_archive_and_revision_are_rejected(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("only the watch creator"):
            contract.update_draft(watch_id, "Other", "example.org", [SOURCE], ["Other clause"], 300, "")

    mock_baseline(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)
    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("only the watch creator"):
            contract.archive_watch(watch_id)
        with direct_vm.expect_revert("only the watch creator"):
            contract.propose_revision(watch_id, [SOURCE], ["Changed clause"], 300, "changed")


@pytest.mark.direct
def test_duplicate_and_malformed_evidence_inputs_fail(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    with direct_vm.expect_revert("duplicate source"):
        contract.create_draft("Subject", "example.org", [SOURCE, SOURCE], ["Clause"], AUTHORITY, BENEFICIARY, RIGHT_LABEL, 300, "")
    with direct_vm.expect_revert("canonical domain"):
        contract.create_draft("Subject", "localhost", ["https://localhost/a"], ["Clause"], "https://localhost/.well-known/driftglass.json", BENEFICIARY, RIGHT_LABEL, 300, "")
    with direct_vm.expect_revert("canonical domain"):
        contract.create_draft("Subject", "example.org", ["https://attacker.test/policy"], ["Clause"], AUTHORITY, BENEFICIARY, RIGHT_LABEL, 300, "")
    with direct_vm.expect_revert("duplicate reliance clause"):
        contract.create_draft("Subject", "example.org", [SOURCE], ["Clause", "Clause"], AUTHORITY, BENEFICIARY, RIGHT_LABEL, 300, "")


@pytest.mark.direct
def test_cooldown_duplicate_execution_and_invalid_transitions(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    mock_baseline(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)
    with direct_vm.expect_revert("not an activatable draft"):
        contract.activate_baseline(watch_id)

    direct_vm.clear_mocks()
    mock_checkpoint(direct_vm)
    contract.run_checkpoint(watch_id)
    with direct_vm.expect_revert("interval has not elapsed"):
        contract.run_checkpoint(watch_id)


@pytest.mark.direct
def test_broken_and_inconclusive_results_do_not_masquerade_as_stable(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    mock_baseline(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)

    direct_vm.clear_mocks()
    removed_content = "Official policy for Example Service. Export is no longer available."
    removed = {
        "outcome": "BROKEN",
        "clauses": [{"index": 0, "verdict": "REMOVED", "source_index": 0, "excerpt": "Export is no longer available", "reason": "The right was removed."}],
        "reason": "The relied-upon right was removed.",
    }
    mock_checkpoint(direct_vm, removed_content, removed)
    contract.run_checkpoint(watch_id)
    assert load_watch(contract)["assessment"] == "BROKEN"

    second_id = draft(contract, "Example Service export guarantee")
    direct_vm.clear_mocks()
    mock_baseline(direct_vm, contract, second_id)
    contract.activate_baseline(second_id)
    direct_vm.clear_mocks()
    ambiguous = {
        "outcome": "INCONCLUSIVE",
        "clauses": [{"index": 0, "verdict": "INCONCLUSIVE", "source_index": 0, "excerpt": "", "reason": "Official text conflicts."}],
        "reason": "The available official evidence conflicts.",
    }
    mock_checkpoint(direct_vm, "Conflicting official policy statements.", ambiguous)
    contract.run_checkpoint(second_id)
    after = load_watch(contract, second_id)
    assert after["assessment"] == "INCONCLUSIVE"
    assert after["fresh_until"] == 0


@pytest.mark.direct
def test_revision_is_verified_and_history_remains_append_only(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    mock_baseline(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)
    original = json.loads(contract.get_revisions(watch_id))[0]

    contract.propose_revision(
        watch_id,
        [SOURCE],
        ["Customers may export all records at any time.", "Pricing changes receive 30 days notice."],
        600,
        "Added the pricing reliance clause.",
    )
    revised = {
        "outcome": "VERIFIED",
        "clauses": [
            BASELINE["clauses"][0],
            {"index": 1, "supported": True, "source_index": 0, "excerpt": "30 days notice before a material pricing change"},
        ],
        "reason": "Both reliance clauses are directly supported.",
    }
    direct_vm.clear_mocks()
    mock_baseline(direct_vm, contract, watch_id, result=revised)
    contract.activate_revision(watch_id)
    revisions = json.loads(contract.get_revisions(watch_id))
    assert len(revisions) == 2
    assert revisions[0] == original
    assert revisions[1]["number"] == 2
    assert json.loads(contract.get_revision_proposal(watch_id)) == {}


@pytest.mark.direct
def test_domain_manifest_is_required_and_must_bind_exact_policy(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    direct_vm.mock_web(r"policy\.example\.org/terms", {"status": 200, "body": CONTENT})
    mock_authority(direct_vm, contract, watch_id, {"policy_digest": "0" * 64})
    contract.activate_baseline(watch_id)
    watch = load_watch(contract, watch_id)
    assert watch["lifecycle"] == "DRAFT"
    assert watch["authority_verified"] is False
    assert watch["last_activation_result"]["outcome"] == "AUTHORITY_UNVERIFIED"


@pytest.mark.direct
def test_complete_source_after_legacy_14000_boundary_is_verified(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    long_content = ("Context without the relied-upon promise. " * 420) + CONTENT
    assert long_content.index("Customers may export") > 14000
    mock_baseline(direct_vm, contract, watch_id, content=long_content)
    contract.activate_baseline(watch_id)
    revision = json.loads(contract.get_revisions(watch_id))[0]
    commitment = revision["verification"]["sources"][0]
    assert commitment["content_length"] == len(long_content)
    assert commitment["coverage"] == "FULL"
    assert load_watch(contract, watch_id)["lifecycle"] == "ACTIVE"


@pytest.mark.direct
def test_oversized_source_fails_closed_with_full_length_commitment(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract)
    oversized = "x" * 60001
    direct_vm.mock_web(r"policy\.example\.org/terms", {"status": 200, "body": oversized})
    mock_authority(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)
    result = load_watch(contract, watch_id)["last_activation_result"]
    assert result["outcome"] == "SOURCE_UNAVAILABLE"
    assert result["sources"][0]["coverage"] == "TOO_LARGE"
    assert result["sources"][0]["content_length"] == len(oversized)


@pytest.mark.direct
def test_consensus_state_enforces_and_revokes_beneficiary_right(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy(CONTRACT, sdk_version=SDK_RELEASE)
    watch_id = draft(contract, beneficiary="0x" + direct_bob.hex())
    mock_baseline(direct_vm, contract, watch_id)
    contract.activate_baseline(watch_id)
    assert load_watch(contract, watch_id)["right_status"] == "ENFORCEABLE"

    first_action = "a" * 64
    with direct_vm.expect_revert("only the bound beneficiary"):
        contract.exercise_right(watch_id, first_action)
    with direct_vm.prank(direct_bob):
        receipt = contract.exercise_right(watch_id, first_action)
        assert len(receipt) == 64
        with direct_vm.expect_revert("already exercised"):
            contract.exercise_right(watch_id, first_action)

    direct_vm.clear_mocks()
    removed_content = "Official policy for Example Service. Export is no longer available."
    removed = {
        "outcome": "BROKEN",
        "clauses": [{"index": 0, "verdict": "REMOVED", "source_index": 0, "excerpt": "Export is no longer available", "reason": "The right was removed."}],
        "reason": "The relied-upon right was removed.",
    }
    mock_checkpoint(direct_vm, removed_content, removed)
    contract.run_checkpoint(watch_id)
    assert load_watch(contract, watch_id)["right_status"] == "REVOKED"
    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("not enforceable"):
            contract.exercise_right(watch_id, "b" * 64)
