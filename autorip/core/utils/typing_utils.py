from typing import Optional, TypeVar

T = TypeVar("T")


def aware(value: Optional[T]) -> T:
    """
    Ensure that the given value is not None.

    Args:
        - value (Optional[T]): The value to check.

    Returns:
        T: The given value, guaranteed to be not None.

    Raises:
        AssertionError: If the given value is None.
    """
    assert value is not None
    return value
