"""Hello unit test module."""

from lib.hello import hello


def test_hello():
    """Test the hello function."""
    assert hello() == "Hello lib"
