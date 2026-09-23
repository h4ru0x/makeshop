import csv
import os
import sys
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# --- extract_shops ---

def test_extract_shops_returns_list():
    from main import extract_shops

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        {"id": "shop-1", "name": "Tienda A", "owner_id": "uid-1", "phone_number": "123"}
    ]
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    result = extract_shops(mock_conn)

    assert len(result) == 1
    assert result[0]["name"] == "Tienda A"


def test_extract_shops_queries_shop_table():
    from main import extract_shops

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = []
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    extract_shops(mock_conn)

    query = mock_cursor.execute.call_args[0][0]
    assert "Shop" in query


# --- extract_memberships ---

def test_extract_memberships_returns_list():
    from main import extract_memberships

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        {"id": 1, "user_id": "uid-1", "role": "ADMIN", "shop_id": "shop-1"}
    ]
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    result = extract_memberships(mock_conn)

    assert len(result) == 1
    assert result[0]["role"] == "ADMIN"


def test_extract_memberships_queries_membership_table():
    from main import extract_memberships

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = []
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    extract_memberships(mock_conn)

    query = mock_cursor.execute.call_args[0][0]
    assert "Membership" in query


# --- write_csv ---

def test_write_csv_shops(tmp_path):
    from main import write_csv

    records = [{"id": "s1", "name": "Tienda A", "owner_id": "u1", "phone_number": "123"}]
    filepath = str(tmp_path / "shops.csv")
    write_csv(records, filepath)

    with open(filepath, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    assert len(rows) == 1
    assert rows[0]["name"] == "Tienda A"


def test_write_csv_raises_on_empty(tmp_path):
    from main import write_csv

    with pytest.raises(ValueError, match="No records"):
        write_csv([], str(tmp_path / "empty.csv"))


# --- upload_to_s3 ---

def test_upload_to_s3_calls_boto3(tmp_path):
    from main import upload_to_s3

    filepath = str(tmp_path / "shops.csv")
    with open(filepath, "w") as f:
        f.write("id,name\n")

    with patch("main.boto3") as mock_boto3:
        mock_s3 = MagicMock()
        mock_boto3.client.return_value = mock_s3
        upload_to_s3(filepath, "my-bucket", "shops/shops.csv")

    mock_s3.upload_file.assert_called_once_with(filepath, "my-bucket", "shops/shops.csv")
