import os
import json
from typing import List, Dict, Any
from app.services.command_catalog_service import CommandCatalogService
from app.services.engine_service import EngineService

class CommandTestService:
    @staticmethod
    def run_all_tests() -> Dict[str, Any]:
        CommandCatalogService.load_catalog()
        catalog = list(CommandCatalogService._catalog.values())
        
        # Determine sandbox path
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        sandbox_dir = os.path.join(base_dir, "tests", "sandbox")
        
        # Ensure sandbox setup is fresh by executing the setup script
        setup_script = os.path.join(base_dir, "tests", "sandbox_setup.py")
        os.system(f"python {setup_script}")
        
        results = {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "details": []
        }
        
        # We only want to test unique commands (since the catalog might have duplicates due to mapping by base_cmd)
        tested_cmds = set()

        for cmd_info in catalog:
            cmd = cmd_info["command"]
            if cmd in tested_cmds:
                continue
            tested_cmds.add(cmd)
            
            results["total"] += 1
            
            if not cmd_info.get("testable_automatically", False):
                results["skipped"] += 1
                results["details"].append({
                    "command": cmd,
                    "status": "SKIPPED",
                    "reason": "Not flagged for automatic testability (DANGEROUS, PRIVILEGED, INTERACTIVE, or REMOTE)"
                })
                continue
                
            try:
                # Execute in sandbox
                exec_res = EngineService.execute_command(cmd, working_dir=sandbox_dir)
                
                if exec_res.status == "COMPLETED" or exec_res.exit_code == 0:
                    # Some safe commands like 'grep xyz' might return 1 if not found, but we consider execution successful if no fatal error
                    results["passed"] += 1
                    results["details"].append({
                        "command": cmd,
                        "status": "PASSED",
                        "output": exec_res.stdout[:100] + "..." if len(exec_res.stdout) > 100 else exec_res.stdout
                    })
                else:
                    results["failed"] += 1
                    results["details"].append({
                        "command": cmd,
                        "status": "FAILED",
                        "output": exec_res.stderr[:200]
                    })
            except Exception as e:
                results["failed"] += 1
                results["details"].append({
                    "command": cmd,
                    "status": "FAILED",
                    "output": str(e)
                })

        # Save report
        report_path = os.path.join(base_dir, "docs", "command_test_report.md")
        CommandTestService._generate_markdown_report(results, report_path)
                
        return results

    @staticmethod
    def _generate_markdown_report(results: Dict[str, Any], report_path: str):
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            f.write("# Command Execution Test Report\n\n")
            f.write(f"**Total Tested:** {results['total']}\n")
            f.write(f"**Passed:** {results['passed']}\n")
            f.write(f"**Failed:** {results['failed']}\n")
            f.write(f"**Skipped:** {results['skipped']}\n\n")
            
            f.write("## Test Details\n\n")
            f.write("| Command | Status | Output/Reason |\n")
            f.write("|---------|--------|---------------|\n")
            for d in results["details"]:
                output = d.get("output", d.get("reason", "")).replace("\n", " ").replace("|", "\\|")
                f.write(f"| `{d['command']}` | {d['status']} | {output} |\n")
