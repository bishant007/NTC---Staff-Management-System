from pathlib import Path
import re

source = Path(r"D:\Bishant\NTC\NTC-Staff-System\database\ntc_staff_mysql8_backup.sql")
output = Path(r"D:\Bishant\NTC\NTC-Staff-System\database\leave_requests_fixed.sql")

text = source.read_text(encoding="utf-16")

match = re.search(
    r"INSERT INTO `leave_requests` VALUES (.*?);",
    text,
    re.DOTALL
)

if not match:
    raise RuntimeError("Could not find leave_requests INSERT in backup.")

values_text = match.group(1)

rows = re.findall(
    r"\((?:[^()']|'[^']*')*\)",
    values_text
)

converted_rows = []

for row in rows:
    content = row[1:-1]

    fields = re.findall(
        r"(?:'[^']*'|NULL|_binary '(?:[^']*)'|[^,]+)(?=,|$)",
        content
    )

    fields = [field.strip() for field in fields]

    if len(fields) != 17:
        raise ValueError(
            f"Expected 17 fields but found {len(fields)}:\n{row}"
        )

    (
        id_,
        admin_remarks,
        created_at,
        leave_start_time,
        reason,
        return_date_time,
        status,
        updated_at,
        staff_id,
        department_head_approved_at,
        department_head_signature,
        leave_type,
        rejection_reason,
        section_head_approved_at,
        section_head_signature,
        department_head_notes,
        section_head_notes
    ) = fields

    converted_row = (
        f"({id_},{admin_remarks},{created_at},"
        f"{department_head_approved_at},{department_head_notes},"
        f"{department_head_signature},{leave_start_time},"
        f"{leave_type},{reason},{rejection_reason},"
        f"{return_date_time},{section_head_approved_at},"
        f"{section_head_notes},{section_head_signature},"
        f"{status},{updated_at},{staff_id})"
    )

    converted_rows.append(converted_row)

sql = """SET FOREIGN_KEY_CHECKS=0;

INSERT INTO `leave_requests`
(`id`,
`admin_remarks`,
`created_at`,
`department_head_approved_at`,
`department_head_notes`,
`department_head_signature`,
`leave_start_time`,
`leave_type`,
`reason`,
`rejection_reason`,
`return_date_time`,
`section_head_approved_at`,
`section_head_notes`,
`section_head_signature`,
`status`,
`updated_at`,
`staff_id`)
VALUES
""" + ",\n".join(converted_rows) + """;

SET FOREIGN_KEY_CHECKS=1;
"""

output.write_text(sql, encoding="utf-8")

print(f"Successfully converted {len(converted_rows)} leave requests.")
print(f"Created: {output}")