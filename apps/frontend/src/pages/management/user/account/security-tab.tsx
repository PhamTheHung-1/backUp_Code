import { useChangePasswordMutation } from "@fe/async-store/user";
import Card from "@fe/components/card";
import { useUserActions } from "@fe/store/userStore";
import { Button, Form, Input } from "antd";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type FieldType = {
	oldPassword?: string;
	newPassword?: string;
	confirmPassword?: string;
};

export default function SecurityTab() {
	const [form] = Form.useForm<FieldType>();
	const navigate = useNavigate();
	const { clearUserInfoAndToken } = useUserActions();
	const changePasswordMutation = useChangePasswordMutation();

	const handleFinish = async (values: FieldType) => {
		if (!values.oldPassword || !values.newPassword) return;

		try {
			await changePasswordMutation.mutateAsync({
				oldPassword: values.oldPassword,
				newPassword: values.newPassword,
			});

			toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
			form.resetFields();

			clearUserInfoAndToken();
			navigate("/login", { replace: true });
		} catch (error: any) {
			toast.error(error.message || "Đổi mật khẩu thất bại. Vui lòng thử lại!");
		}
	};

	return (
		<Card className="h-auto! flex-col">
			<Form form={form} layout="vertical" onFinish={handleFinish} labelCol={{ span: 8 }} className="w-full">
				<Form.Item<FieldType> label="Old Password" name="oldPassword" rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại!" }]}>
					<Input.Password placeholder="Nhập mật khẩu hiện tại" />
				</Form.Item>

				<Form.Item<FieldType>
					label="New Password"
					name="newPassword"
					rules={[
						{ required: true, message: "Vui lòng nhập mật khẩu mới!" },
						{ min: 6, message: "Mật khẩu mới phải có tối thiểu 6 ký tự!" },
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue("oldPassword") !== value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error("Mật khẩu mới không được trùng với mật khẩu cũ!"));
							},
						}),
					]}
				>
					<Input.Password placeholder="Nhập mật khẩu mới" />
				</Form.Item>

				<Form.Item<FieldType>
					label="Confirm New Password"
					name="confirmPassword"
					dependencies={["newPassword"]}
					rules={[
						{ required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue("newPassword") === value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
							},
						}),
					]}
				>
					<Input.Password placeholder="Nhập lại mật khẩu mới" />
				</Form.Item>

				<div className="flex w-full justify-end mt-4">
					<Button type="primary" htmlType="submit" loading={changePasswordMutation.isPending}>
						Save Changes
					</Button>
				</div>
			</Form>
		</Card>
	);
}
