import type { BasicStatus, MenuType } from "./enum";

export interface UserToken {
	accessToken?: string;
	refreshToken?: string;
}

export interface UserInfo {
	id: string | number;
	email: string;
	username: string;
	password?: string;
	avatar?: string;
	role?: Role;
	roles?: number[];
	status?: BasicStatus | boolean;
	permissions?: Permission[];
}

export interface Organization {
	id: string;
	name: string;
	status: string;
	desc?: string;
	order?: number;
	children?: Organization[];
}

export interface Permission {
	id: string;
	parentId: string;
	name: string;
	label: string;
	type: MenuType;
	route: string;
	status?: BasicStatus; //active true | false
	order?: number;
	icon?: string;
	component?: string;
	hide?: boolean;
	hideTab?: boolean;
	frameSrc?: URL;
	newFeature?: boolean;
	children?: Permission[];
}

export interface Role {
	id: string;
	name: string;
	label: string;
	status: BasicStatus;
	order?: number;
	desc?: string;
	permission?: Permission[];
}

export interface Menu {
	id?: number;
	parentId?: number;
	name: string;
	label: string;
	type: MenuType;
	route: string;
	status?: BasicStatus; //active true | false
	order?: number;
	icon?: string;
	component?: string;
	hide?: boolean;
	hideTab?: boolean;
	frameSrc?: URL;
	newFeature?: boolean;
	children?: Menu[];
}
