import re


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
