"""Hello unit test module."""

from proj.hello import hello


def test_hello():
    """Test the hello function."""
    assert hello() == "Hello proj"
