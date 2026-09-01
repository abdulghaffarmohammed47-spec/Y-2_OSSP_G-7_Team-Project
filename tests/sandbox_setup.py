import os
import shutil

def setup_sandbox():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sandbox_dir = os.path.join(base_dir, "sandbox")
    
    if os.path.exists(sandbox_dir):
        shutil.rmtree(sandbox_dir)
        
    os.makedirs(sandbox_dir)
    
    # Create test files
    with open(os.path.join(sandbox_dir, "file1.txt"), "w") as f:
        f.write("Hello World\nThis is a test file.\n")
        
    with open(os.path.join(sandbox_dir, "main.c"), "w") as f:
        f.write("#include <stdio.h>\nint main() { printf(\"Hello\"); return 0; }\n")
        
    os.makedirs(os.path.join(sandbox_dir, "logs"))
    with open(os.path.join(sandbox_dir, "logs", "app.log"), "w") as f:
        f.write("ERROR: connection failed\nINFO: started\n")
        
    print(f"Sandbox created at {sandbox_dir}")

if __name__ == "__main__":
    setup_sandbox()
