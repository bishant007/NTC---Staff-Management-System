from pathlib import Path
import re

source = Path(r"D:\Bishant\NTC\NTC-Staff-System\database\ntc_staff_mysql8_backup.sql")
output = Path(r"D:\Bishant\NTC\NTC-Staff-System\database\ntc_staff_data_migration.sql")

lines = source.read_text(encoding="utf-16").splitlines()

result = [
    "SET FOREIGN_KEY_CHECKS=0;",
    ""
]

inside_insert = False
buffer = []

for line in lines:
    stripped = line.strip()

    if stripped.startswith("INSERT INTO `"):
        table_name = stripped.split("`")[1]

        if table_name == "staff":
            inside_insert = True
            buffer = [line]
        elif table_name == "leave_balances":
            inside_insert = True
            buffer = [line]
        elif table_name == "leave_requests":
            inside_insert = True
            buffer = [line]
        else:
            inside_insert = False
            buffer = []

    elif inside_insert:
        buffer.append(line)

    if inside_insert and stripped.endswith(";"):
        statement = "\n".join(buffer)

        # Convert staff INSERT to explicit MariaDB column order
        if statement.startswith("INSERT INTO `staff`"):
            values_match = re.search(r"VALUES\s*(.*);", statement, re.DOTALL)

            if values_match:
                values = values_match.group(1)

                statement = (
                    "INSERT INTO `staff` "
                    "(`id`,`branch`,`department`,`email`,`full_name`,"
                    "`is_first_login`,`password`,`phone`,`staff_id`,`role`,"
                    "`signature_path`,`signature_uploaded_at`,`created_by_id`,"
                    "`department_head_id`,`section_head_id`) VALUES "
                    + values
                    + ";"
                )

        # Convert leave_requests INSERT to explicit MariaDB column order
        elif statement.startswith("INSERT INTO `leave_requests`"):
            values_match = re.search(r"VALUES\s*(.*);", statement, re.DOTALL)

            if values_match:
                values_text = values_match.group(1)

                # Original MySQL 8 order:
                # id, admin_remarks, created_at, leave_start_time, reason,
                # return_date_time, status, updated_at, staff_id,
                # department_head_approved_at, department_head_signature,
                # leave_type, rejection_reason, section_head_approved_at,
                # section_head_signature, department_head_notes,
                # section_head_notes
                #
                # MariaDB order:
                # id, admin_remarks, created_at, department_head_approved_at,
                # department_head_notes, department_head_signature,
                # leave_start_time, leave_type, reason, rejection_reason,
                # return_date_time, section_head_approved_at,
                # section_head_notes, section_head_signature, status,
                # updated_at, staff_id

                rows = re.findall(r"\((?:[^()']|'[^']*')*\)", values_text)

                converted_rows = []

                for row in rows:
                    content = row[1:-1]

                    # Split on commas outside quoted strings
                    fields = re.findall(
                        r"(?:'[^']*'|NULL|[^,]+)(?=,|$)",
                        content
                    )

                    fields = [field.strip() for field in fields]

                    if len(fields) != 17:
                        raise ValueError(
                            f"Expected 17 fields in leave_requests row, "
                            f"found {len(fields)}:\n{row}"
                        )

                    # Original positions
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

                    # MariaDB order
                    new_row = (
                        f"({id_},{admin_remarks},{created_at},"
                        f"{department_head_approved_at},{department_head_notes},"
                        f"{department_head_signature},{leave_start_time},"
                        f"{leave_type},{reason},{rejection_reason},"
                        f"{return_date_time},{section_head_approved_at},"
                        f"{section_head_notes},{section_head_signature},"
                        f"{status},{updated_at},{staff_id})"
                    )

                    converted_rows.append(new_row)

                statement = (
                    "INSERT INTO `leave_requests` "
                    "(`id`,`admin_remarks`,`created_at`,"
                    "`department_head_approved_at`,`department_head_notes`,"
                    "`department_head_signature`,`leave_start_time`,"
                    "`leave_type`,`reason`,`rejection_reason`,"
                    "`return_date_time`,`section_head_approved_at`,"
                    "`section_head_notes`,`section_head_signature`,"
                    "`status`,`updated_at`,`staff_id`) VALUES\n"
                    + ",\n".join(converted_rows)
                    + ";"
                )

        result.append(statement)
        result.append("")

        inside_insert = False
        buffer = []

result.extend([
    "SET FOREIGN_KEY_CHECKS=1;",
    ""
])

output.write_text("\n".join(result), encoding="utf-8")

print(f"Created: {output}")