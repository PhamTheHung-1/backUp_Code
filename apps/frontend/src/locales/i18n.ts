import { getStringItem } from "@fe/utils/storage";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { LocalEnum, StorageEnum } from "#fe/enum";
import en_US from "./lang/en_US";
import vi_VN from "./lang/vi_VN";
import zh_CN from "./lang/zh_CN";

const defaultLng = getStringItem(StorageEnum.I18N) || (LocalEnum.en_US as string);

// Set the HTML lang attribute on initialization，Otherwise, the browser translation prompt will pop up if the system language and settings are different
document.documentElement.lang = defaultLng;

i18n
	// detect user language
	// learn more: https://github.com/i18next/i18next-browser-languageDetector
	.use(LanguageDetector)
	// pass the i18n instance to react-i18next.
	.use(initReactI18next)
	// init i18next
	// for all options read: https://www.i18next.com/overview/configuration-options
	.init({
		debug: true,
		lng: defaultLng, // localstorage -> i18nextLng: en_US
		fallbackLng: LocalEnum.en_US,
		interpolation: {
			escapeValue: false, // not needed for react as it escapes by default
		},
		resources: {
			en_US: { translation: en_US },
			zh_CN: { translation: zh_CN },
			vi_VN: { translation: vi_VN },
		},
	});

export default i18n;
export const { t } = i18n;
