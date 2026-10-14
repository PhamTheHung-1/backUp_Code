import type { OrganizationType } from "./org.schema";

export const ORG_LIST: OrganizationType[] = [
	{
		id: "1",
		name: "East China Branch",
		status: "enable",
		desc: "lorem lorem fake data data",
		order: 1,
		children: [
			{
				id: "1-1",
				name: "R&D Department",
				status: "disable",
				desc: "",
				order: 1,
			},
			{
				id: "1-2",
				name: "Marketing Department",
				status: "enable",
				desc: "",
				order: 2,
			},
			{
				id: "1-3",
				name: "Finance Department",
				status: "enable",
				desc: "",
				order: 3,
			},
		],
	},
	{
		id: "2",
		name: "South China Branch",
		status: "enable",
		desc: "lorem lorem fake data data",
		order: 2,
		children: [
			{
				id: "2-1",
				name: "R&D Department",
				status: "disable",
				desc: "",
				order: 1,
			},
			{
				id: "2-2",
				name: "Marketing Department",
				status: "enable",
				desc: "",
				order: 2,
			},
			{
				id: "2-3",
				name: "Finance Department",
				status: "enable",
				desc: "",
				order: 3,
			},
		],
	},
];

export const orgRepository = {
	async findAll(): Promise<OrganizationType[]> {
		return ORG_LIST;
	},
};

export type OrgRepository = typeof orgRepository;
