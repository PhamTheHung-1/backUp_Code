import "@fe/utils/highlight";
import ReactQuill, { type ReactQuillProps } from "react-quill";
import "./styles.css";
import Toolbar, { formats } from "./toolbar";

interface Props extends ReactQuillProps {
	sample?: boolean;
}
export default function Editor({ id = "slash-quill", sample = false, ...other }: Props) {
	const modules = {
		toolbar: {
			container: `#${id}`,
		},
		history: {
			delay: 500,
			maxStack: 100,
			userOnly: true,
		},
		syntax: true,
		clipboard: {
			matchVisual: false,
		},
	};
	return (
		<div className="slash-editor">
			<Toolbar id={id} isSimple={sample} />
			<ReactQuill modules={modules} formats={formats} {...other} placeholder="Write something awesome..." />
		</div>
	);
}
