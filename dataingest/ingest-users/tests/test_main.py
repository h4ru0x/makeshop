import csv
import os
import sys
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# --- extract_users ---

def test_extract_users_returns_list_of_dicts():
    from main import extract_users

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        {"id": "uid-1", "name": "Carlos", "email": "c@b.com",
         "phone_number": "123", "role": "OWNER", "subscription": "FREE",
         "shop_id": None, "enabled": True, "email_verified": True,
         "token_version": 0, "created_at": None, "updated_at": None}
    ]
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    result = extract_users(mock_conn)

    assert len(result) == 1
    assert result[0]["name"] == "Carlos"
    assert result[0]["email"] == "c@b.com"


def test_extract_users_calls_correct_query():
    from main import extract_users

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = []
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    extract_users(mock_conn)

    call_args = mock_cursor.execute.call_args[0][0]
    assert "FROM users" in call_args
    assert "SELECT" in call_args


# --- write_csv ---

def test_write_csv_creates_file_with_header(tmp_path):
    from main import write_csv

    records = [{"id": "1", "name": "Carlos", "email": "c@b.com"}]
    filepath = str(tmp_path / "test.csv")
    write_csv(records, filepath)

    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    assert len(rows) == 1
    assert rows[0]["name"] == "Carlos"
    assert rows[0]["email"] == "c@b.com"


def test_write_csv_raises_on_empty_records(tmp_path):
    from main import write_csv

    with pytest.raises(ValueError, match="No records"):
        write_csv([], str(tmp_path / "empty.csv"))


def test_write_csv_multiple_rows(tmp_path):
    from main import write_csv

    records = [
        {"id": "1", "name": "Ana"},
        {"id": "2", "name": "Luis"},
    ]
    filepath = str(tmp_path / "multi.csv")
    write_csv(records, filepath)

    with open(filepath, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    assert len(rows) == 2
    assert rows[1]["name"] == "Luis"


# --- upload_to_s3 ---

def test_upload_to_s3_calls_boto3(tmp_path):
    from main import upload_to_s3

    filepath = str(tmp_path / "users.csv")
    with open(filepath, "w") as f:
        f.write("id,name\n1,Carlos\n")

    with patch("main.boto3") as mock_boto3:
        mock_s3 = MagicMock()
        mock_boto3.client.return_value = mock_s3
        upload_to_s3(filepath, "my-bucket", "users/users.csv")

    mock_boto3.client.assert_called_once_with("s3")
    mock_s3.upload_file.assert_called_once_with(filepath, "my-bucket", "users/users.csv")
