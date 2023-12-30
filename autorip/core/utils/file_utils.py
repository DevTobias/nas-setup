import os
import pathlib
import shutil
import stat
from io import BufferedReader, BufferedWriter
from typing import Callable, Optional

from typing_extensions import Literal

BUFFER_SIZE = 64 * 1024


class SameFileError(OSError):
    """Raised when source and destination are the same file."""


class SpecialFileError(OSError):
    """Raised when trying to do a kind of operation (e.g. copying) which is
    not supported on a special file (e.g. a named pipe)"""


def copy_with_callback(
    src: str,
    dest: str,
    callback: Optional[Callable[[int, int, int], None]] = None,
    follow_symlinks: bool = True,
    buffer_size: Literal[65536] = BUFFER_SIZE,
):
    """Copy file with a callback.
        callback, if provided, must be a callable and will be
        called after ever buffer_size bytes are copied.
    Args:
        src: source file, must exist
        dest: destination path; if an existing directory,
            file will be copied to the directory;
            if it is not a directory, assumed to be destination filename
        callback: callable to call after every buffer_size bytes are copied
            callback will called as callback(bytes_copied since last callback, total
            bytes copied, total bytes in source file)
        follow_symlinks: bool; if True, follows symlinks
        buffer_size: how many bytes to copy before each call to the callback, default = 4Mb

    Returns:
        Full path to destination file
    Raises:
        FileNotFoundError if src doesn't exist
        SameFileError if src and dest are the same file
        SpecialFileError if src or dest are special files (e.g. named pipe)
    Note: Does not copy extended attributes, resource forks or other metadata.
    """

    srcfile = pathlib.Path(src)
    destpath = pathlib.Path(dest)

    if not srcfile.is_file():
        raise FileNotFoundError(f"src file `{src}` doesn't exist")

    destfile = destpath / srcfile.name if destpath.is_dir() else destpath

    if destfile.exists() and srcfile.samefile(destfile):
        raise SameFileError(
            f"source file `{src}` and destination file `{dest}` are the same file."
        )

    # check for special files, lifted from shutil.copy source
    for fname in [srcfile, destfile]:
        try:
            st = os.stat(str(fname))
        except OSError:
            # File most likely does not exist
            pass
        else:
            if stat.S_ISFIFO(st.st_mode):
                raise SpecialFileError(f"`{fname}` is a named pipe")

    if callback is not None and not callable(callback):
        raise ValueError("callback is not callable")

    if not follow_symlinks and srcfile.is_symlink():
        if destfile.exists():
            os.unlink(destfile)
        os.symlink(os.readlink(str(srcfile)), str(destfile))
    else:
        size = os.stat(src).st_size
        with open(srcfile, "rb") as fsrc:
            with open(destfile, "wb") as fdest:
                _copyfileobj(
                    fsrc, fdest, callback=callback, total=size, length=buffer_size
                )
    shutil.copymode(str(srcfile), str(destfile))
    return str(destfile)


def _copyfileobj(
    fsrc: BufferedReader,
    fdest: BufferedWriter,
    total: int,
    length: int,
    callback: Optional[Callable[[int, int, int], None]] = None,
):
    """copy from fsrc to fdest
    Args:
        fsrc: filehandle to source file
        fdest: filehandle to destination file
        callback: callable callback that will be called after every length bytes copied
        total: total bytes in source file (will be passed to callback)
        length: how many bytes to copy at once (between calls to callback)
    """
    copied = 0

    while True:
        buf = fsrc.read(length)
        if not buf:
            break
        fdest.write(buf)
        copied += len(buf)
        if callback is not None:
            callback(len(buf), copied, total)
