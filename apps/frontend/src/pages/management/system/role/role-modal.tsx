import type { MenuTree } from "@fe/async-store/menu";
import type { CreateRoleType } from "@fe/async-store/role";
import { Form, Input, Modal, Radio, Tree, type TreeProps } from "antd";
import { useEffect, useState } from "react";

export type RoleModalProps = {
	formValue: CreateRoleType;
	title: string;
	show: boolean;
	menus: MenuTree;
	apis: any[];
	onSave: (role: CreateRoleType) => void;
	onCancel: VoidFunction;
};
export function RoleModal({ title, show, formValue, menus, apis, onSave, onCancel }: RoleModalProps) {
	const [form] = Form.useForm();
	const [halfCheckedKeys, setHalfCheckedKeys] = useState<React.Key[]>([]);
	const [checkedKeys, setCheckedKeys] = useState<React.Key[]>(formValue.menus || []);
	const [checkedAPIs, setCheckedAPIs] = useState(formValue.apis || []);
	console.log("checked APIs:", checkedAPIs);

	const onCheck: TreeProps["onCheck"] = (checkedKeysValue, e) => {
		setCheckedKeys(checkedKeysValue as React.Key[]);
		setHalfCheckedKeys(e.halfCheckedKeys || []);
	};

	const onAPICheck: TreeProps["onCheck"] = (checkedKeysValue, _) => {
		//@ts-expect-error
		setCheckedAPIs(checkedKeysValue);
	};

	useEffect(() => {
		form.setFieldsValue({ ...formValue });
		setCheckedKeys(formValue.menus || []);
		setCheckedAPIs(formValue.apis || []);
	}, [formValue, form]);

	return (
		<Modal
			title={title}
			open={show}
			onOk={() => {
				const formData = form.getFieldsValue();
				formData.menus = checkedKeys;
				formData.hmenus = halfCheckedKeys;
				formData.apis = checkedAPIs.filter(k => typeof k === "number");
				onSave(formData as CreateRoleType);
			}}
			onCancel={onCancel}
		>
			<Form initialValues={formValue} form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 18 }} layout="horizontal">
				<Form.Item<CreateRoleType> label="Name" name="name" required>
					<Input />
				</Form.Item>
				<Form.Item<CreateRoleType> label="Status" name="status" required>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={true}> Enable </Radio>
						<Radio value={false}> Disable </Radio>
					</Radio.Group>
				</Form.Item>
				<Form.Item<CreateRoleType> label="Desc" name="desc">
					<Input.TextArea />
				</Form.Item>

				<Form.Item<CreateRoleType> label="Menus" name="menus">
					<Tree
						checkable
						selectable={false}
						onCheck={onCheck}
						checkedKeys={checkedKeys}
						//@ts-expect-error
						treeData={menus}
						fieldNames={{
							key: "id",
							children: "children",
							title: "name",
						}}
					/>
				</Form.Item>
				<Form.Item<CreateRoleType> label="APIs" name="apis">
					<Tree
						checkable
						selectable={false}
						onCheck={onAPICheck}
						checkedKeys={checkedAPIs}
						treeData={apis}
						fieldNames={{
							key: "id",
							children: "children",
							title: "name",
						}}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
