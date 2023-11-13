import subprocess

from .logger import logger


def call_process(args: list[str]):
    """
    Executes a subprocess with the given arguments and returns the return code, stdout, and stderr.

    Args:
        - args (list[str]): The command and arguments to execute.

    Returns:
        Tuple[int, str, str]: The return code, stdout, and stderr of the executed command.
    """

    try:
        p = subprocess.run(args, capture_output=True, text=True, check=True)
        logger.debug(f"{args[0]} output:\n{p.returncode}\n{p.stdout}\n{p.stderr}\n")
        return p.returncode, p.stdout, p.stderr
    except OSError:
        logger.error(f"{args[0]} could not be found. Is it installed?")
        raise
