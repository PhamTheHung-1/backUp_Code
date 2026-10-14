interface XtagGroup {
	name: string;
	tags?: string[];
}

//Note: bắt buộc phải gõ tags: undefined
export const xtagGroups = [
	{
		name: "System",
		tags: ["Menu", "Role"],
	},
	// Tất cả các tags không thuộc vào một nhóm cụ thể nào đặt trong nhóm @----@ này
	{
		name: "@----@",
		tags: ["User", "Other", "Organization"],
	},
] as const satisfies XtagGroup[];

function extractAndValidateTags(groups: readonly XtagGroup[]) {
	const seenTags = new Set<string>();
	const seenGroupNames = new Set<string>();
	const result: string[] = [];

	for (const group of groups) {
		if (!group.tags || group.tags.length === 0) {
			if (seenGroupNames.has(group.name)) {
				throw new Error(`Trùng lặp group name: "${group.name}"`);
			}
			if (seenTags.has(group.name)) {
				throw new Error(`Tên group "${group.name}" bị trùng với một tag đã tồn tại.`);
			}
			seenGroupNames.add(group.name);
			seenTags.add(group.name);
			result.push(group.name);
		} else {
			for (const tag of group.tags) {
				if (seenTags.has(tag)) {
					throw new Error(`Trùng lặp tag: "${tag}"`);
				}
				seenTags.add(tag);
				result.push(tag);
			}
		}
	}
	return result;
}

export const xtags = extractAndValidateTags(xtagGroups);

// Utility type để trích xuất literal type
type ExtractTags<T> = T extends readonly (infer Group)[]
	? Group extends { tags: readonly (infer TTag extends string)[] }
		? TTag
		: Group extends { name: infer TName extends string }
			? TName
			: never
	: never;

export type TagType = ExtractTags<typeof xtagGroups>;

export const openapiConfig = {
	xtagGroups,
	xtags,
	scalarVersion: "1.25.74",
	scalar: {
		content: {
			openapi: "3.2.0",
		},
	},
	info: {
		title: "Backend API Documentation",
		description: "Backend API Documentation",
		version: "1.0",
	},
};
