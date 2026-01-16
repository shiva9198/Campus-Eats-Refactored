import subprocess
import os

def run_git(cmd):
    subprocess.run(cmd, shell=True, check=True)

def main():
    # Get status
    status_output = subprocess.check_output("git status --porcelain", shell=True).decode("utf-8")
    
    lines = status_output.strip().split("\n")
    print(f"Found {len(lines)} remaining changes.")
    
    for line in lines:
        if not line.strip(): continue
        
        # Format: "XY Path" e.g. " M backend/main.py" or "?? newfile.py"
        code = line[:2]
        path = line[3:]
        
        # Determine message
        filename = os.path.basename(path)
        if "D" in code:
            msg = f"Remove {filename}"
        elif "M" in code:
            msg = f"Update {filename}"
        elif "?" in code:
            msg = f"Add {filename}"
        else:
            msg = f"Update {filename}"
            
        print(f"Committing: {path}")
        try:
            run_git(f'git add "{path}"')
            run_git(f'git commit -m "{msg}"')
        except Exception as e:
            print(f"Failed to commit {path}: {e}")

if __name__ == "__main__":
    main()
