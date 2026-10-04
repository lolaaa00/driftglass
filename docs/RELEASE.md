# Release evidence

Only verifiable release facts belong here.

## Milestone candidate source

- Branch: `main`
- Parent commit: `f64a0aa54172a0c1c6130d562167efe9a9002c78`
- Repository contract SHA-256: `7b932cf7ed05959fdd549f521bdbdc8b14842e6b9257f9e0a8a264b57207a26d`
- Release gate: lint, TypeScript, 11 frontend tests, 13 Direct Mode tests, static checks, GenVM lint, network scan, secret scan, and production build passed on 2026-10-04.
- New deployment: pending. Do not submit the legacy address below as the milestone contract.

## Legacy Studionet deployment

The following deployment predates authority binding, complete-response coverage, and enforceable beneficiary rights. It remains documented for provenance only.

- Deployable source commit: `45d1dffb63a38f0b607aab8a724aec89029edf70`
- Repository contract SHA-256: `e1b7438dae198f4b08b4e31c8a5ece783b111d1ec9ebc0ec4668d912c888fe1c`
- Deployed contract SHA-256: `00aad846a48f23e264561b295c52009172340312d6d3bc6614d251ff925adc83`
- Source comparison: the deployed source is identical to `contracts/driftglass.py` except that the CLI transport omitted the file's final newline (34,766 deployed bytes versus 34,767 repository bytes).

- Network: Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Contract address: `0x808FddD60A7FFd16c7abcCF474A159a7E4B1b4A1`
- Deployment transaction: `0xab5acabb0bd835c26ba03ab4e707671c7575fb543d22b1270210f4ec57b4f19a`
- Contract explorer: `https://explorer-studio.genlayer.com/address/0x808FddD60A7FFd16c7abcCF474A159a7E4B1b4A1`
- Transaction explorer: `https://explorer-studio.genlayer.com/tx/0xab5acabb0bd835c26ba03ab4e707671c7575fb543d22b1270210f4ec57b4f19a`
- Finality checked: `FINALIZED`, three `agree` votes, leader and agreeing validator execution results `SUCCESS`, shared state hash `694498d0ba60df76fd4c1f9ee4d6aac5c784dfcfac48979f8e01d52f5a973dc5`.

## Legacy frontend

- Production URL: `https://driftglass-lkue406nh-lolaas-projects.vercel.app/`
- Vercel deployment: `dpl_EUBvQpnYdRhMhnuZQKYi8PYJ2ku7`
- Deployed frontend commit: `fc4339247af270fb4e56d8e77b26c2fa657d1ea2`
- Configured contract: `0x808FddD60A7FFd16c7abcCF474A159a7E4B1b4A1`

## Legacy live lifecycle

The deployment lifecycle above has been checked through finality and successful execution. No product-record lifecycle transaction is claimed: the production ledger currently reads its authoritative empty state, and creating a representative record requires an injected wallet and a user signature.
