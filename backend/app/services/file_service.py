import os
import stat
import datetime
from typing import List
from app.schemas.command import FileItem

WORKSPACE_ROOT = "a:\\Downloads(clg)\\OSSP-GUI\\ShellForge-Pro"

class FileService:
    @staticmethod
    def list_files(rel_path: str = "") -> List[FileItem]:
        target_dir = os.path.normpath(os.path.join(WORKSPACE_ROOT, rel_path))
        if not target_dir.startswith(os.path.normpath(WORKSPACE_ROOT)):
            target_dir = WORKSPACE_ROOT

        items: List[FileItem] = []
        if not os.path.exists(target_dir):
            return items

        try:
            for entry in os.scandir(target_dir):
                st = entry.stat()
                mod_time = datetime.datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                perms = stat.filemode(st.st_mode)

                items.append(FileItem(
                    name=entry.name,
                    path=os.path.relpath(entry.path, WORKSPACE_ROOT),
                    is_dir=entry.is_dir(),
                    size=st.st_size,
                    permissions=perms,
                    modified=mod_time
                ))
        except Exception:
            pass

        return sorted(items, key=lambda x: (not x.is_dir, x.name))
