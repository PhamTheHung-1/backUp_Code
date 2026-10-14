import { up, useMediaQuery } from "@fe/hooks";
import { useSettings } from "@fe/store/settingStore";
import { ThemeLayout } from "#fe/enum";
import NavHorizontal from "./nav-horizontal";
import NavVertical from "./nav-vertical";

export default function Nav() {
	const { themeLayout } = useSettings();
	const isPc = useMediaQuery(up("md"));

	if (themeLayout === ThemeLayout.Horizontal) return <NavHorizontal />;

	if (isPc) return <NavVertical />;
	return null;
}
