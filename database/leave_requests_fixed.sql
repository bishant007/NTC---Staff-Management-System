SET FOREIGN_KEY_CHECKS=0;

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
(1,NULL,'2026-09-09 23:06:00.956782',NULL,NULL,NULL,'2026-09-09 23:06:00.926498','FULL_DAY','I will be occupied from personal reasons.',NULL,'2026-09-13 03:15:00.000000',NULL,NULL,NULL,'CANCELLED','2026-09-15 04:36:05.458561',2),
(2,NULL,'2026-09-09 23:06:39.631324',NULL,NULL,NULL,'2026-09-09 23:06:39.630355','FULL_DAY','I will be occupied due to personal reasons',NULL,'2026-09-13 03:15:00.000000',NULL,NULL,NULL,'CANCELLED','2026-09-15 04:36:02.304587',2),
(3,NULL,'2026-09-09 23:10:07.680526',NULL,NULL,NULL,'2026-09-09 23:10:07.656269','FULL_DAY','I will be occupied due to personal reasons',NULL,'2026-09-13 03:15:00.000000',NULL,NULL,NULL,'CANCELLED','2026-09-15 04:35:59.419075',2),
(4,NULL,'2026-09-09 23:14:04.921727',NULL,NULL,NULL,'2026-09-09 23:14:04.898468','FULL_DAY','I will be occupied due to personal reasons',NULL,'2026-09-13 03:15:00.000000',NULL,NULL,NULL,'CANCELLED','2026-09-15 04:35:55.940464',2),
(5,NULL,'2026-09-09 23:14:36.613938',NULL,NULL,NULL,'2026-09-09 23:14:36.612963','FULL_DAY','I will be occupied due to personal reasons',NULL,'2026-09-13 03:15:00.000000',NULL,NULL,NULL,'CANCELLED','2026-09-15 04:35:52.437031',2);

SET FOREIGN_KEY_CHECKS=1;
