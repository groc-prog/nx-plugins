"""
Logging configuration for python tolling.
"""
import logging
from os import environ


def get_logger(name: str) -> logging.Logger:
    """
    Gets a logger for python tooling.

    Args:
        name (str): The name of the logger
    """
    log_level = int(environ.get("NX_PYTHON_TOOLING_LOG_LEVEL", logging.INFO))

    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    handler = logging.StreamHandler()
    handler.setLevel(log_level)

    formatter = logging.Formatter("[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger
