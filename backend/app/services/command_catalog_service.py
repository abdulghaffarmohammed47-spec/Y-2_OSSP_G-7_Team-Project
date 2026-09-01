import json
import os
from typing import Dict, Any, Optional

class CommandCatalogService:
    _catalog: Dict[str, Any] = {}
    _is_loaded: bool = False

    @classmethod
    def load_catalog(cls):
        if cls._is_loaded:
            return
            
        # The catalog is generated in docs/linux_command_catalog.json
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        catalog_path = os.path.join(base_dir, "docs", "linux_command_catalog.json")
        
        try:
            with open(catalog_path, "r") as f:
                commands = json.load(f)
                for cmd_data in commands:
                    # Key by base command (e.g. 'rm' handles 'rm', 'rm -r', 'rm -rf')
                    # Actually we will just keep the exact command strings in the index as well
                    cmd_str = cmd_data.get("command", "")
                    base_cmd = cmd_str.split()[0] if cmd_str else ""
                    
                    if cmd_str not in cls._catalog:
                        cls._catalog[cmd_str] = cmd_data
                    if base_cmd not in cls._catalog:
                        # Fallback for base command
                        cls._catalog[base_cmd] = cmd_data
                        
            cls._is_loaded = True
        except Exception as e:
            print(f"Error loading command catalog: {e}")

    @classmethod
    def get_command_info(cls, command_str: str) -> Optional[Dict[str, Any]]:
        cls.load_catalog()
        
        # Sort catalog keys by length descending to match longest prefix first (e.g. "rm -rf" before "rm")
        sorted_keys = sorted(cls._catalog.keys(), key=len, reverse=True)
        
        for key in sorted_keys:
            # Check if command matches key exactly or starts with key + space
            if command_str == key or command_str.startswith(key + " "):
                return cls._catalog[key]
                
        return None

    @classmethod
    def is_known_command(cls, command_str: str) -> bool:
        return cls.get_command_info(command_str) is not None

    @classmethod
    def get_safety_level(cls, command_str: str) -> str:
        info = cls.get_command_info(command_str)
        if info:
            return info.get("danger_level", "RISKY")
        return "RISKY" # Default to risky if unknown
