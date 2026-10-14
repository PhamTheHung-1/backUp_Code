import { faker } from "@faker-js/faker";
import { IconButton, Iconify } from "@fe/components/icon";
import { Checkbox, List } from "antd";

export default function AnalysisTasks() {
	const data = [
		{
			task: faker.lorem.words(),
			checked: false,
		},
		{
			task: faker.lorem.words(),
			checked: true,
		},
		{
			task: faker.lorem.words(),
			checked: false,
		},
		{
			task: faker.lorem.words(),
			checked: false,
		},
	];
	return (
		<List
			size="small"
			dataSource={data}
			renderItem={item => (
				<List.Item
					actions={[
						<IconButton key={item.task}>
							<Iconify icon="fontisto:more-v-a" />
						</IconButton>,
					]}
				>
					<Checkbox
						onChange={e => {
							item.checked = e.target.checked;
						}}
					>
						{item.task}
					</Checkbox>
				</List.Item>
			)}
		/>
	);
}
