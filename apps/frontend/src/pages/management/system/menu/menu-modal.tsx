import type { Menu } from "@be/modules/menu/menu.schema";
import { type CreateMenuType as InsertMenu, useMenusQuery } from "@fe/async-store/menu";
import { AutoComplete, Form, Input, InputNumber, Modal, Radio, TreeSelect } from "antd";
import { useCallback, useEffect, useState } from "react";
import { MenuType } from "#fe/enum";

// Constants
const ENTRY_PATH = "/src/pages";
const PAGES = import.meta.glob("/src/pages/**/*.tsx");
const PAGE_SELECT_OPTIONS = Object.entries(PAGES).map(([path]) => {
	const pagePath = path.replace(ENTRY_PATH, "");
	return {
		label: pagePath,
		value: pagePath,
	};
});

export type MenuModalProps = {
	formValue: InsertMenu;
	title: string;
	show: boolean;
	onSave(menu: InsertMenu): void;
	onCancel: VoidFunction;
};

export default function MenuModal({ title, show, formValue, onSave, onCancel }: MenuModalProps) {
	console.log("Modal: ", formValue.id);

	const [form] = Form.useForm();

	const { data: menus } = useMenusQuery();
	const [compOptions, setCompOptions] = useState(PAGE_SELECT_OPTIONS);
	const [confirmLoading, setConfirmLoading] = useState(false);

	const getParentNameById = useCallback(
		(parentId: number, data = menus) => {
			let name = "";
			if (!data || !parentId) return name;
			for (let i = 0; i < data.length; i += 1) {
				if (data[i].id === parentId) {
					name = data[i].name;
				} else if (data[i].children) {
					name = getParentNameById(parentId, data[i].children);
				}
				if (name) {
					break;
				}
			}
			return name;
		},
		[menus],
	);

	const updateCompOptions = (name: string) => {
		if (!name) return;
		setCompOptions(
			PAGE_SELECT_OPTIONS.filter(path => {
				return path.value.includes(name.toLowerCase());
			}),
		);
	};
	const onOk = async () => {
		setConfirmLoading(true);
		const formData = form.getFieldsValue();
		await onSave(formData);
		setConfirmLoading(false);
	};

	useEffect(() => {
		form.setFieldsValue({ ...formValue });
		if (formValue.parentId) {
			const parentName = getParentNameById(formValue.parentId);
			updateCompOptions(parentName);
		}
	}, [formValue, form, getParentNameById]);

	return (
		<Modal
			forceRender
			title={title}
			open={show}
			onOk={onOk}
			onCancel={onCancel}
			confirmLoading={confirmLoading}
			cancelButtonProps={{ disabled: confirmLoading }}
		>
			<Form initialValues={formValue} form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} layout="horizontal">
				<Form.Item<Menu> name="id" style={{ display: "none" }}>
					<Input />
				</Form.Item>
				<Form.Item<Menu> label="Type" name="type" required>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={MenuType.CATALOGUE}>CATALOGUE</Radio>
						<Radio value={MenuType.MENU}>MENU</Radio>
					</Radio.Group>
				</Form.Item>

				<Form.Item<Menu> label="Name" name="name" required>
					<Input />
				</Form.Item>

				<Form.Item<Menu> label="Label" name="label" required tooltip="internationalization config">
					<Input />
				</Form.Item>

				<Form.Item<Menu> label="Parent" name="parentId" required>
					<TreeSelect
						fieldNames={{
							label: "name",
							value: "id",
							children: "children",
						}}
						allowClear
						treeData={menus}
						onChange={(_value, labelList) => {
							updateCompOptions(labelList[0] as string);
						}}
					/>
				</Form.Item>

				<Form.Item<Menu> label="Route" name="route" required>
					<Input />
				</Form.Item>

				<Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
					{({ getFieldValue }) => {
						if (getFieldValue("type") === MenuType.MENU) {
							return (
								<Form.Item<Menu> label="Component" name="component" required={getFieldValue("type") === MenuType.MENU}>
									<AutoComplete
										options={compOptions}
										filterOption={(input, option) => ((option?.label || "") as string).toLowerCase().includes(input.toLowerCase())}
									/>
								</Form.Item>
							);
						}
						return null;
					}}
				</Form.Item>

				<Form.Item<Menu> label="Icon" name="icon" tooltip="local icon should start with ic">
					<Input />
				</Form.Item>

				<Form.Item<Menu> label="Hide" name="hide" tooltip="hide in menu">
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={false}>Show</Radio>
						<Radio value>Hide</Radio>
					</Radio.Group>
				</Form.Item>

				<Form.Item<Menu> label="Order" name="order">
					<InputNumber style={{ width: "100%" }} />
				</Form.Item>

				<Form.Item<Menu> label="Status" name="active" required>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={true}> Enable </Radio>
						<Radio value={false}> Disable </Radio>
					</Radio.Group>
				</Form.Item>
			</Form>
		</Modal>
	);
}
