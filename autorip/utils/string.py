import re
import unicodedata


def clean_for_filename(string: str):
    """
    Cleans a string to be used as a filename by removing square brackets, replacing spaces with
    hyphens, replacing colons with hyphens, replacing ampersands with 'and', replacing backslashes
    with hyphens, and removing any characters that are not alphanumeric, period, parentheses,
    hyphen, or space.

    Args:
        - string (str): The string to be cleaned.

    Returns:
        str: The cleaned string.
    """

    string = re.sub("\\[(.*?)]", "", string)
    string = re.sub("\\s+", "-", string)
    string = (
        string.replace(" : ", " - ")
        .replace(":", "-")
        .replace("&", "and")
        .replace("\\", " - ")
        .replace(" ", " - ")
        .strip()
    )
    return re.sub("[^\\w.() -]", "", string)


def normalize_disc_title(title: str):
    """
    Normalizes a disc title by removing non-ASCII characters and certain
    strings that are commonly found in Blu-ray titles.

    Args:
       -  title (str): The title to normalize.

    Returns:
        str: The normalized title.
    """

    return (
        unicodedata.normalize("NFKD", title)
        .encode("ascii", "ignore")
        .decode()
        .replace(" - Blu-rayTM", "")
        .replace(" Blu-rayTM", "")
        .replace(" - BLU-RAYTM", "")
        .replace(" - BLU-RAY", "")
        .replace(" - Blu-ray", "")
    )
