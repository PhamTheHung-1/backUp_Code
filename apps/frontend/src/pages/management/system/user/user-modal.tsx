import type { RoleList } from "@fe/async-store/role";
import type { UserItem } from "@fe/async-store/user";
import { Form, Input, Modal, Radio, Select } from "antd";
import { useEffect } from "react";

export type UserModalProps = {
	formValue: Partial<UserItem> & { password?: string };
	title: string;
	show: boolean;
	roles?: RoleList;
	onSave: (user: Partial<UserItem> & { password?: string }) => void;
	onCancel: VoidFunction;
};

export function UserModal({ title, show, formValue, roles, onSave, onCancel }: UserModalProps) {
	const [form] = Form.useForm();
	const isEdit = Boolean(formValue.id);

	useEffect(() => {
		if (show) {
			form.setFieldsValue({
				...formValue,
				status: formValue.status ?? true,
				roles: formValue.roles ?? [],
			});
		} else {
			form.resetFields();
		}
	}, [formValue, show, form]);

	const roleOptions = (roles || []).map(r => ({
		label: r.name,
		value: r.id,
	}));

	return (
		<Modal
			title={title}
			open={show}
			destroyOnClose
			onOk={async () => {
				try {
					const values = await form.validateFields();
					onSave({
						...formValue,
						...values,
					});
				} catch (_err) {
					// validation failed
				}
			}}
			onCancel={onCancel}
		>
			<Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} layout="horizontal">
				<Form.Item
					label="Email"
					name="email"
					rules={[
						{ required: true, message: "Please input email" },
						{ type: "email", message: "Please enter a valid email" },
					]}
				>
					<Input placeholder="user@example.com" />
				</Form.Item>

				<Form.Item label="Username" name="username">
					<Input placeholder="Username" />
				</Form.Item>

				<Form.Item
					label="Password"
					name="password"
					rules={isEdit ? [] : [{ required: true, message: "Please input password (min 6 characters)", min: 6 }]}
					extra={isEdit ? "Leave blank to keep current password" : undefined}
				>
					<Input.Password placeholder={isEdit ? "New password (optional)" : "Password (min 6 chars)"} />
				</Form.Item>

				<Form.Item label="Roles" name="roles">
					<Select mode="multiple" allowClear placeholder="Select roles" options={roleOptions} />
				</Form.Item>

				<Form.Item label="Status" name="status" initialValue={true}>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={true}>Enable</Radio>
						<Radio value={false}>Disable</Radio>
					</Radio.Group>
				</Form.Item>
			</Form>
		</Modal>
	);
}
