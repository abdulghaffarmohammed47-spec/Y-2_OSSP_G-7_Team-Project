import re
from app.schemas.command import ValidationResult
from app.services.command_catalog_service import CommandCatalogService

class SafetyService:
    @staticmethod
    def validate(command_str: str) -> ValidationResult:
        cmd_trim = command_str.strip()
        
        # Load catalog to ensure it's ready
        CommandCatalogService.load_catalog()
        
        # Check command against catalog
        cmd_info = CommandCatalogService.get_command_info(cmd_trim)
        if not cmd_info:
            return ValidationResult(
                command=command_str,
                is_safe=False,
                safety_level="RISKY",
                reason="Command is outside the strictly validated catalog and may be unsafe.",
                requires_confirmation=True
            )
            
        safety_level = cmd_info.get("danger_level", "RISKY")
        
        if safety_level in ["DANGEROUS", "PRIVILEGED", "RISKY", "CAUTION", "REMOTE", "INTERACTIVE"]:
            # Depending on safety level, requires confirmation
            requires_confirm = True
            is_safe = False
            
            # Caution is technically safe but warrants warning
            if safety_level == "CAUTION":
                is_safe = True 
                
            return ValidationResult(
                command=command_str,
                is_safe=is_safe,
                safety_level=safety_level,
                reason=f"Command categorized as {safety_level}. Notes: {cmd_info.get('notes', '')}",
                requires_confirmation=requires_confirm
            )

        return ValidationResult(
            command=command_str,
            is_safe=True,
            safety_level="SAFE",
            reason="Command complies with workspace safety policy and is in catalog.",
            requires_confirmation=False
        )
