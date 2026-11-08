import { Iconify, SvgIcon } from "@fe/components/icon";
import { CircleLoading } from "@fe/components/loading";
import { Tag } from "antd";
import { lazy, Suspense } from "react";
import type { AppRouteObject } from "#fe/router";

const Calendar = lazy(() => import("@fe/pages/sys/others/calendar"));

function Wrapper({ children }: any) {
	return <Suspense fallback={<CircleLoading />}>{children}</Suspense>;
}
const others: AppRouteObject[] = [
	{
		path: "calendar",
		element: (
			<Wrapper>
				<Calendar />
			</Wrapper>
		),
		meta: {
			label: "sys.menu.calendar",
			icon: <Iconify icon="solar:calendar-bold-duotone" size={24} />,
			key: "/calendar",
		},
	},
	{
		element: (
			<Wrapper>
				<div />
			</Wrapper>
		),
		meta: {
			label: "sys.menu.disabled",
			icon: <SvgIcon icon="ic_disabled" className="ant-menu-item-icon" size="24" />,
			disabled: true,
			key: "/disabled",
		},
	},
	{
		path: "label",
		element: (
			<Wrapper>
				<div />
			</Wrapper>
		),
		meta: {
			label: "sys.menu.label",
			icon: <SvgIcon icon="ic_label" className="ant-menu-item-icon" size="24" />,
			suffix: (
				<Tag color="cyan" icon={<Iconify icon="solar:bell-bing-bold-duotone" size={14} />}>
					NEW
				</Tag>
			),
			key: "/label",
		},
	},


];

export default others;
