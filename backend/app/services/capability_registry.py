from abc import ABC, abstractmethod
from typing import Dict, Any, Type, Optional
from app.services.command_catalog_service import CommandCatalogService
from app.schemas.command import CommandIntent

class BaseCapability(ABC):
    @abstractmethod
    def handle(self, command: str, cmd_info: Dict[str, Any]) -> CommandIntent:
        pass

class FileCapability(BaseCapability):
    def handle(self, command: str, cmd_info: Dict[str, Any]) -> CommandIntent:
        return CommandIntent(
            intent=cmd_info["description"],
            command=command,
            arguments=command.split()[1:],
            safety_level=cmd_info["danger_level"],
            explanation=f"File operation handled via capability registry. Notes: {cmd_info['notes']}"
        )

class GenericCapability(BaseCapability):
    def handle(self, command: str, cmd_info: Dict[str, Any]) -> CommandIntent:
        return CommandIntent(
            intent=cmd_info["description"],
            command=command,
            arguments=command.split()[1:],
            safety_level=cmd_info["danger_level"],
            explanation=f"Category: {cmd_info['category']}. Handled via capability registry."
        )

class CapabilityRegistry:
    _handlers: Dict[str, Type[BaseCapability]] = {
        "Files": FileCapability,
        "Search": GenericCapability,
        "Navigation": GenericCapability,
        "Compression": GenericCapability,
        "Processes": GenericCapability,
        "System": GenericCapability,
        "Disk": GenericCapability,
        "Network": GenericCapability,
        "Variables": GenericCapability,
        "Shell": GenericCapability,
        "Hardware": GenericCapability,
        "Users and Groups": GenericCapability,
        "Packages": GenericCapability,
        "Remote": GenericCapability,
        "Permissions": GenericCapability,
        "Shortcuts": GenericCapability
    }
    
    _default_handler = GenericCapability()

    @classmethod
    def get_handler(cls, category: str) -> BaseCapability:
        handler_class = cls._handlers.get(category)
        if handler_class:
            return handler_class()
        return cls._default_handler

    @classmethod
    def route_command(cls, command: str) -> Optional[CommandIntent]:
        CommandCatalogService.load_catalog()
        info = CommandCatalogService.get_command_info(command)
        if not info:
            return None
            
        handler = cls.get_handler(info["category"])
        return handler.handle(command, info)
