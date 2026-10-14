import { type CreateMenuType, type Menu, useCreateMenu, useDeleteMenu, useMenusQuery } from "@fe/async-store/menu";
import { IconButton, Iconify, SvgIcon } from "@fe/components/icon";
// import type { InsertMenu } from "@be/models/menu";

import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, Popconfirm, Tag } from "antd";
import Table, { type ColumnsType } from "antd/es/table";
import { isNil } from "ramda";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BasicStatus, MenuType } from "#fe/enum";
import MenuModal, { type MenuModalProps } from "./menu-modal";

const defaultMenuValue: CreateMenuType = {
	id: 0, //flag to remove id before sending to server
	name: "",
	label: "",
	route: "",
	component: "",
	icon: "",
	hide: false,
	active: true,
	type: MenuType.CATALOGUE,
};

export default function MenuPage() {
	const queryClient = useQueryClient();
	const { data: menus } = useMenusQuery();

	const menusMutation = useCreateMenu();
	const deleteMenuMutation = useDeleteMenu();

	const { t } = useTranslation();

	const [menuModalProps, setMenuModalProps] = useState<MenuModalProps>({
		formValue: { ...defaultMenuValue },
		title: "New",
		show: false,
		onSave: async (menu: CreateMenuType) => {
			console.log("onSave: ", menu);
			await menusMutation.mutateAsync(menu);
			setMenuModalProps(prev => ({ ...prev, show: false }));
			queryClient.invalidateQueries({ queryKey: ["menus", "list"] });
		},
		onCancel: () => {
			setMenuModalProps(prev => ({ ...prev, show: false }));
		},
	});
	const columns: ColumnsType<Menu> = [
		{
			title: "Name",
			dataIndex: "name",
			width: 300,
			render: (_, record) => <div>{t(record.label)}</div>,
		},
		{
			title: "Type",
			dataIndex: "type",
			width: 60,
			render: (_, record) => <Tag color="processing">{MenuType[record.type]}</Tag>,
		},
		{
			title: "Icon",
			dataIndex: "icon",
			width: 60,
			render: (icon: string) => {
				if (isNil(icon)) return "";
				if (icon.startsWith("ic")) {
					return <SvgIcon icon={icon} size={18} className="ant-menu-item-icon" />;
				}
				return <Iconify icon={icon} size={18} className="ant-menu-item-icon" />;
			},
		},
		{
			title: "Component",
			dataIndex: "component",
		},
		{
			title: "Status",
			dataIndex: "status",
			align: "center",
			width: 120,
			render: status => (
				<Tag color={status === BasicStatus.DISABLE ? "error" : "success"}>{status === BasicStatus.DISABLE ? "Disable" : "Enable"}</Tag>
			),
		},
		{ title: "Order", dataIndex: "order", width: 60 },
		{
			title: "Action",
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-end text-gray">
					{record?.type === MenuType.CATALOGUE && (
						<IconButton onClick={() => onCreate(record.id)}>
							<Iconify icon="gridicons:add-outline" size={18} />
						</IconButton>
					)}
					<IconButton onClick={() => onEdit(record)}>
						<Iconify icon="solar:pen-bold-duotone" size={18} />
					</IconButton>
					<Popconfirm title="Delete the menu" okText="Yes" cancelText="No" placement="left" onConfirm={() => onDelete(record.id)}>
						<IconButton>
							<Iconify icon="mingcute:delete-2-fill" size={18} className="text-error" />
						</IconButton>
					</Popconfirm>
				</div>
			),
		},
	];

	const onCreate = (parentId?: number) => {
		setMenuModalProps(prev => ({
			...prev,
			show: true,
			// ...defaultMenuValue,
			title: "New",
			formValue: { ...defaultMenuValue, parentId: parentId ?? undefined },
		}));
	};

	const onEdit = (formValue: CreateMenuType) => {
		console.log("OnEdit: ", formValue);

		setMenuModalProps(prev => ({
			...prev,
			show: true,
			title: "Edit",
			formValue,
		}));
	};
	const onDelete = async (menuId: number) => {
		await deleteMenuMutation.mutateAsync(menuId);
		queryClient.invalidateQueries({ queryKey: ["menus", "list"] });
		return true;
	};

	return (
		<Card
			title={t("sys.menu.system.menu.title")}
			extra={
				<Button type="primary" onClick={() => onCreate()}>
					New
				</Button>
			}
		>
			<Table rowKey="id" size="small" scroll={{ x: "max-content" }} pagination={false} columns={columns} dataSource={menus} />
			<MenuModal {...menuModalProps} />
		</Card>
	);
}
