import builtins
import sys
import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import sessionmaker, DeclarativeMeta

def test_base_is_declarative():
    """Comprueba que Base sea una clase declarativa de SQLAlchemy."""
    from src.models.db import Base
    assert isinstance(Base, DeclarativeMeta)


def test_get_db_yields_and_closes():
    """Verifica que get_db() yieldé la sesión y luego la cierre correctamente."""
    from src.models.db import get_db

    mock_session_instance = MagicMock()
    mock_session_class = MagicMock(return_value=mock_session_instance)

    with patch("src.models.db.session", mock_session_class):
        gen = get_db()
        db_instance = next(gen)
        assert db_instance == mock_session_instance
        with pytest.raises(StopIteration):
            next(gen)
        mock_session_instance.close.assert_called_once()
