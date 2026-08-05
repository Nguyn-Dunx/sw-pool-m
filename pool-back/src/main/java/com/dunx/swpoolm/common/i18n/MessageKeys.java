package com.dunx.swpoolm.common.i18n;

import lombok.experimental.UtilityClass;

@UtilityClass
public class MessageKeys {

    @UtilityClass
    public static class Common {
        public static final String SUCCESS = "info.success";
        public static final String CREATED = "info.created";
        public static final String UPDATED = "info.updated";
        public static final String DELETED = "info.deleted";

        public static final String NOT_FOUND = "error.not_found";
        public static final String INTERNAL_SERVER = "error.internal_server";
        public static final String VALIDATION = "error.validation";
        public static final String ACCESS_DENIED = "error.access_denied";
    }

    @UtilityClass
    public static class Auth {
        public static final String INVALID_CREDENTIALS =
                "error.auth.invalid_credentials";

        public static final String UNAUTHORIZED =
                "error.auth.unauthorized";

        public static final String ACCOUNT_LOCKED =
                "error.auth.account_locked";

        public static final String ACCOUNT_DISABLED =
                "error.auth.account_disabled";

        public static final String SESSION_EXPIRED =
                "error.auth.session_expired";

        public static final String LOGIN_SUCCESS =
                "info.auth.login_success";

        public static final String LOGOUT_SUCCESS =
                "info.auth.logout_success";

        public static final String INVALID_PAYLOAD =
                "error.auth.invalid_payload";
    }

    @UtilityClass
    public static class User {

        public static final String NOT_FOUND_BY_PHONE =
                "error.user.not_found_by_phone";

        public static final String PHONE_EXISTS =
                "error.user.phone_exists";

        public static final String EMAIL_EXISTS =
                "error.user.email_exists";

        public static final String USERNAME_EXISTS =
                "error.user.username_exists";
    }

    @UtilityClass
    public static class Validation {

        public static final String REQUIRED =
                "validation.required";

        public static final String EMAIL =
                "validation.email";

        public static final String PHONE =
                "validation.phone";

        public static final String LENGTH =
                "validation.length";
    }

    @UtilityClass
    public static class Role {
        public static final String NOT_FOUND = "error.role.not_found";
    }

    @UtilityClass
    public static class Teacher {
        public static final String NOT_FOUND = "error.teacher.not_found";
    }

    @UtilityClass
    public static class Student {
        public static final String NOT_FOUND = "error.student.not_found";
    }

    @UtilityClass
    public static class Enrollment {
        public static final String TEACHER_INACTIVE = "error.enrollment.teacher_inactive";
        public static final String TEACHER_NOT_FOUND = "error.enrollment.teacher_not_found";
        public static final String DUPLICATE_ACTIVE_STYLE = "error.enrollment.duplicate_active_style";
        public static final String EMPTY_TEACHERS = "error.enrollment.empty_teachers";
    }

    @UtilityClass
    public static class Attendance {
        public static final String FUTURE_DATE = "error.attendance.future_date";
        public static final String INVALID_DATE = "error.attendance.invalid_date";
        public static final String DUPLICATE = "error.attendance.duplicate";
        public static final String QUOTA_EXCEEDED = "error.attendance.quota_exceeded";
        public static final String UNAUTHORIZED = "error.attendance.unauthorized";
    }

    @UtilityClass
    public static class EnrollmentRequest {
        public static final String NOT_FOUND = "error.enrollment_request.not_found";
        public static final String ALREADY_REVIEWED = "error.enrollment_request.already_reviewed";
        public static final String DUPLICATE_PENDING = "error.enrollment_request.duplicate_pending";
    }
}