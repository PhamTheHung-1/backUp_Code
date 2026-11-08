import { t } from "elysia";

export const staffEmploymentStatuses = ["active", "on_leave", "terminated"] as const;
export const membershipStatuses = ["invited", "active", "suspended", "removed"] as const;
export const genders = ["male", "female", "other", "unknown"] as const;

const nullableString = (maxLength: number) => t.Union([t.String({ maxLength }), t.Null()]);

export const staffJobTitleSchema = t.Object({
	id: t.Number(),
	clinicId: t.Number(),
	code: t.String(),
	name: t.String(),
	status: t.Boolean(),
	createdAt: t.Union([t.String(), t.Null()]),
	updatedAt: t.Union([t.String(), t.Null()]),
});

export const staffUserSchema = t.Object({
	id: t.Number(),
	email: nullableString(254),
	username: nullableString(150),
	status: t.Union([t.Boolean(), t.Null()]),
});

export const staffRoleSchema = t.Object({
	id: t.Number(),
	name: nullableString(100),
	status: t.Boolean(),
});

export const staffProfileSchema = t.Object({
	profileId: t.Number(),
	membershipId: t.Number(),
	clinicId: t.Number(),
	staffCode: t.String(),
	fullName: t.String(),
	phone: nullableString(32),
	dateOfBirth: nullableString(10),
	gender: t.Union([t.Literal("male"), t.Literal("female"), t.Literal("other"), t.Literal("unknown"), t.Null()]),
	address: nullableString(500),
	jobTitle: t.Union([staffJobTitleSchema, t.Null()]),
	specialties: t.Array(t.String({ maxLength: 120 })),
	employmentStatus: t.Union([t.Literal("active"), t.Literal("on_leave"), t.Literal("terminated")]),
	startedAt: nullableString(10),
	endedAt: nullableString(10),
	note: nullableString(5000),
	user: staffUserSchema,
	membership: t.Object({
		status: t.Union([
			t.Literal("invited"),
			t.Literal("active"),
			t.Literal("suspended"),
			t.Literal("removed"),
		]),
		branchScope: t.Union([t.Literal("all"), t.Literal("assigned")]),
		joinedAt: t.Union([t.String(), t.Null()]),
	}),
	roles: t.Array(staffRoleSchema),
	createdAt: t.Union([t.String(), t.Null()]),
	updatedAt: t.Union([t.String(), t.Null()]),
});

export const staffListQuerySchema = t.Object({
	page: t.Optional(t.Numeric({ minimum: 1, multipleOf: 1 })),
	pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100, multipleOf: 1 })),
	search: t.Optional(t.String({ maxLength: 100 })),
	jobTitleId: t.Optional(t.Numeric({ minimum: 1 })),
	employmentStatus: t.Optional(
		t.Union([t.Literal("active"), t.Literal("on_leave"), t.Literal("terminated")]),
	),
	membershipStatus: t.Optional(
		t.Union([
			t.Literal("invited"),
			t.Literal("active"),
			t.Literal("suspended"),
			t.Literal("removed"),
		]),
	),
	roleId: t.Optional(t.Numeric({ minimum: 1 })),
	userStatus: t.Optional(t.Boolean()),
	sortBy: t.Optional(t.Union([t.Literal("fullName"), t.Literal("staffCode"), t.Literal("startedAt"), t.Literal("createdAt")])),
	sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
});

export const staffProfileInputSchema = t.Object({
	staffCode: t.String({ minLength: 1, maxLength: 50, pattern: "\\S" }),
	fullName: t.String({ minLength: 1, maxLength: 150, pattern: "\\S" }),
	phone: t.Optional(t.Nullable(t.String({ maxLength: 32 }))),
	dateOfBirth: t.Optional(t.Nullable(t.String({ format: "date" }))),
	gender: t.Optional(
		t.Nullable(t.Union([t.Literal("male"), t.Literal("female"), t.Literal("other"), t.Literal("unknown")])),
	),
	address: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
	jobTitleId: t.Optional(t.Nullable(t.Numeric({ minimum: 1 }))),
	specialties: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 120 }))),
	employmentStatus: t.Optional(t.Union([t.Literal("active"), t.Literal("on_leave"), t.Literal("terminated")])),
	startedAt: t.Optional(t.Nullable(t.String({ format: "date" }))),
	endedAt: t.Optional(t.Nullable(t.String({ format: "date" }))),
	note: t.Optional(t.Nullable(t.String({ maxLength: 5000 }))),
});

export const staffCreateSchema = t.Object(
	{
		profile: staffProfileInputSchema,
		user: t.Optional(
			t.Object({
				email: t.String({ format: "email", maxLength: 254 }),
				username: t.Optional(t.String({ maxLength: 150 })),
				password: t.String({ minLength: 6, maxLength: 50 }),
				status: t.Optional(t.Boolean()),
			}, { additionalProperties: false }),
		),
		existingUserId: t.Optional(t.Numeric({ minimum: 1 })),
		membership: t.Object({
			status: t.Optional(t.Union([t.Literal("invited"), t.Literal("active"), t.Literal("suspended"), t.Literal("removed")])),
			branchScope: t.Optional(t.Union([t.Literal("all"), t.Literal("assigned")])),
			roleIds: t.Optional(t.Array(t.Numeric({ minimum: 1 }), { maxItems: 50 })),
		}, { additionalProperties: false }),
	},
	{ additionalProperties: false },
);
export type StaffCreate = typeof staffCreateSchema.static;

export const staffUpdateSchema = t.Object(
	{
		staffCode: t.Optional(t.String({ minLength: 1, maxLength: 50, pattern: "\\S" })),
		fullName: t.Optional(t.String({ minLength: 1, maxLength: 150, pattern: "\\S" })),
		phone: t.Optional(t.Nullable(t.String({ maxLength: 32 }))),
		dateOfBirth: t.Optional(t.Nullable(t.String({ format: "date" }))),
		gender: t.Optional(t.Nullable(t.Union([t.Literal("male"), t.Literal("female"), t.Literal("other"), t.Literal("unknown")]))),
		address: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
		jobTitleId: t.Optional(t.Nullable(t.Numeric({ minimum: 1 }))),
		specialties: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 120 }))),
		startedAt: t.Optional(t.Nullable(t.String({ format: "date" }))),
		endedAt: t.Optional(t.Nullable(t.String({ format: "date" }))),
		note: t.Optional(t.Nullable(t.String({ maxLength: 5000 }))),
	},
	{ additionalProperties: false },
);
export type StaffUpdate = typeof staffUpdateSchema.static;

export const staffProfileStatusSchema = t.Object({
	employmentStatus: t.Union([t.Literal("active"), t.Literal("on_leave"), t.Literal("terminated")]),
	endedAt: t.Optional(t.Nullable(t.String({ format: "date" }))),
	note: t.Optional(t.Nullable(t.String({ maxLength: 5000 }))),
}, { additionalProperties: false });

export const staffMembershipStatusSchema = t.Object({
	status: t.Union([
		t.Literal("invited"),
		t.Literal("active"),
		t.Literal("suspended"),
		t.Literal("removed"),
	]),
	reason: t.Optional(t.String({ maxLength: 500 })),
}, { additionalProperties: false });

export const staffLinkUserSchema = t.Object({
	existingUserId: t.Numeric({ minimum: 1 }),
}, { additionalProperties: false });

export const staffAccountUpdateSchema = t.Object(
	{
		email: t.Optional(t.String({ format: "email", maxLength: 254 })),
		username: t.Optional(t.String({ maxLength: 150 })),
	},
	{ additionalProperties: false },
);

export const staffRolesSchema = t.Object({
	roleIds: t.Array(t.Numeric({ minimum: 1 }), { maxItems: 50 }),
}, { additionalProperties: false });

export const staffJobTitleCreateSchema = t.Object({
	code: t.String({ minLength: 1, maxLength: 50, pattern: "\\S" }),
	name: t.String({ minLength: 1, maxLength: 100, pattern: "\\S" }),
	status: t.Optional(t.Boolean()),
}, { additionalProperties: false });

export const staffJobTitleUpdateSchema = t.Object({
	code: t.Optional(t.String({ minLength: 1, maxLength: 50, pattern: "\\S" })),
	name: t.Optional(t.String({ minLength: 1, maxLength: 100, pattern: "\\S" })),
	status: t.Optional(t.Boolean()),
}, { additionalProperties: false });

export const staffListResponseSchema = t.Object({
	items: t.Array(staffProfileSchema),
	page: t.Number(),
	pageSize: t.Number(),
	total: t.Number(),
});
