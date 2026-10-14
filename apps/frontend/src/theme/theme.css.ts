import "./theme-vars.css";
import { type AddChannelToLeaf, themeTokens } from "./type";

const contractInitval = {
	...themeTokens,
	colors: addColorChannels(themeTokens.colors),
};

type DeepStringLeaves<T> = T extends object ? { [K in keyof T]: DeepStringLeaves<T[K]> } : string;

function createThemeVars<T extends Record<string, any>>(obj: T, prefix = ""): DeepStringLeaves<T> {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(obj)) {
		const varName = prefix ? `${prefix}-${key}` : `--${key}`;
		if (value !== null && typeof value === "object") {
			result[key] = createThemeVars(value, varName);
		} else {
			result[key] = `var(${varName})`;
		}
	}
	return result as DeepStringLeaves<T>;
}

// create theme contract without @vanilla-extract/css
export const themeVars = createThemeVars(contractInitval);

function addColorChannels<T extends Record<string, any>>(obj: T): AddChannelToLeaf<T> {
	const result: Record<string, any> = {};
	const isLeafObject = Object.values(obj).every(v => v === null || typeof v === "string");

	if (isLeafObject) {
		for (const [key, value] of Object.entries(obj)) {
			result[key] = value;
			result[`${key}Channel`] = "";
		}
	} else {
		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === "object" && value !== null) {
				result[key] = addColorChannels(value);
			} else {
				result[key] = value;
			}
		}
	}

	return result as AddChannelToLeaf<T>;
}
