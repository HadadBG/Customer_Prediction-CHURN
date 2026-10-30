import subprocess
import sys


def main():
    command = [
        sys.executable,
        "-m",
        "pytest",
        "--cov=src",
        "--cov-report=term-missing"
    ]

    subprocess.run(command, check=True)


if __name__ == "__main__":
    main()