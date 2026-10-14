import { cn } from "@fe/utils";
import { forwardRef } from "react";
import SimpleBar, { type Props as SimplebarProps } from "simplebar-react";

export type ScrollbarProps = SimplebarProps & {
	fillContainer?: boolean;
};

/**
 * https://www.npmjs.com/package/simplebar-react?activeTab=readme
 */
const Scrollbar = forwardRef<HTMLElement, ScrollbarProps>(({ children, className, fillContainer = true, ...other }, ref) => {
	return (
		<SimpleBar
			scrollableNodeProps={{ ref }}
			clickOnTrack={false}
			className={cn(
				"flex flex-col grow min-w-0 min-h-0 max-h-full",
				fillContainer &&
					"[&_.simplebar-content]:flex [&_.simplebar-content]:flex-col [&_.simplebar-content]:flex-auto [&_.simplebar-content]:min-h-full",
				className,
			)}
			{...other}
		>
			{children}
		</SimpleBar>
	);
});

Scrollbar.displayName = "Scrollbar";

export default Scrollbar;
