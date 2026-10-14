import { useRouter } from "@fe/router/hooks";
import { useLayoutEffect } from "react";

type Props = {
	src: string;
};
export default function ExternalLink({ src }: Props) {
	const { back } = useRouter();
	useLayoutEffect(() => {
		window.open(src, "_black");
		back();
	});
	return <div />;
}
