import logging
from logging.handlers import QueueHandler, QueueListener
from queue import Queue

_log_queue = Queue()
_handler = logging.StreamHandler()
_handler.setFormatter(logging.Formatter("[%(levelname)s] %(name)s: %(message)s"))
_listener = QueueListener(_log_queue, _handler, respect_handler_level=True)
_listener.start()

import atexit
atexit.register(_listener.stop)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(f"kbs.{name}")
    if not logger.handlers:
        logger.addHandler(QueueHandler(_log_queue))
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger
