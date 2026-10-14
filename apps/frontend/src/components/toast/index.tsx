import { useSettings } from "@fe/store/settingStore";
import { themeVars } from "@fe/theme/theme.css";
// import { rgbAlpha } from "@fe/utils/theme";
import { Toaster } from "sonner";
// import styled from "styled-components";

import { Iconify } from "../icon";

/**
 * https://sonner.emilkowal.ski/getting-started
 */
export default function Toast() {
	const { themeMode } = useSettings();

	return (
		<div
			className={`
				[&_[data-sonner-toast]]:font-semibold [&_[data-sonner-toast]]:text-sm
				[&_[data-type=info]_[data-action]]:!text-info hover:[&_[data-type=info]_[data-action]]:!bg-info/10
				[&_[data-type=error]_[data-action]]:!text-error hover:[&_[data-type=error]_[data-action]]:!bg-error/10
				[&_[data-type=success]_[data-action]]:!text-success hover:[&_[data-type=success]_[data-action]]:!bg-success/10
				[&_[data-type=warning]_[data-action]]:!text-warning hover:[&_[data-type=warning]_[data-action]]:!bg-warning/10
			`}
		>
			<Toaster
				position="top-right"
				theme={themeMode}
				toastOptions={{
					duration: 3000,
					style: {
						backgroundColor: themeVars.colors.background.paper,
					},
					classNames: {
						toast: "rounded-lg border-0",
						description: "text-xs text-current/45",
						content: "flex-1 ml-2",
						icon: "flex items-center justify-center px-4 rounded-lg",
						success: "bg-success/10",
						error: "bg-error/10",
						warning: "bg-warning/10",
						info: "bg-info/10",
						// Map trực tiếp vào props của Sonner:
						cancelButton: "!bg-transparent !text-text-primary hover:!bg-hover",
						actionButton: "!bg-transparent !text-primary hover:!bg-primary/10",
						closeButton: "!top-0 !right-0 !left-auto border border-dashed !bg-bg-paper !border-common-border",
					},
				}}
				icons={{
					success: (
						<div className="p-2 bg-success/10 rounded-lg">
							<Iconify icon="carbon:checkmark-filled" size={24} color={themeVars.colors.palette.success.default} />
						</div>
					),
					error: (
						<div className="p-2 bg-error/10 rounded-lg">
							<Iconify icon="carbon:warning-hex-filled" size={24} color={themeVars.colors.palette.error.default} />
						</div>
					),
					warning: (
						<div className="p-2 bg-warning/10 rounded-lg">
							<Iconify icon="carbon:warning-alt-filled" size={24} color={themeVars.colors.palette.warning.default} />
						</div>
					),
					info: (
						<div className="p-2 bg-info/10 rounded-lg">
							<Iconify icon="carbon:information-filled" size={24} color={themeVars.colors.palette.info.default} />
						</div>
					),
					loading: (
						<div className="p-2 bg-gray-400/10 text-gray-400 rounded-lg">
							<Iconify icon="svg-spinners:6-dots-scale-middle" size={24} speed={3} />
						</div>
					),
				}}
				expand
			/>
		</div>
	);
}

// const ToasterStyleWrapper = styled.div`
//   [data-sonner-toast] {
//     font-weight: 600;
//     font-size: 14px;

//     [data-cancel] {
//       color: ${themeVars.colors.text.primary};
//       background-color: transparent;
//       &:hover {
//         background-color: ${rgbAlpha(themeVars.colors.text.primaryChannel, 0.08)};
//       }
//     }

//     /* Default */
//     [data-action] {
//       color: ${themeVars.colors.palette.primary.default};
//       background-color: transparent;
//       &:hover {
//         background-color: ${rgbAlpha(themeVars.colors.palette.primary.defaultChannel, 0.08)};
//       }
//     }

//     /* Info */
//     &[data-type="info"] [data-action] {
//       color: ${themeVars.colors.palette.info.default};
//       background-color: transparent;
//       &:hover {
//         background-color: ${`rgba(${themeVars.colors.palette.info.defaultChannel}, 0.08)`};
//       }
//     }

//     /* Error */
//     &[data-type="error"] [data-action] {
//       color: ${themeVars.colors.palette.error.default};
//       background-color: transparent;
//       &:hover {
//         background-color: ${`rgba(${themeVars.colors.palette.error.defaultChannel}, 0.08)`};
//       }
//     }

//     /* Success */
//     &[data-type="success"] [data-action] {
//       color: ${themeVars.colors.palette.success.default};
//       background-color: transparent;
//       &:hover {
//         background-color: ${`rgba(${themeVars.colors.palette.success.defaultChannel}, 0.08)`};
//       }
//     }

//     /* Warning */
//     &[data-type="warning"] [data-action] {
//       color: ${themeVars.colors.palette.warning.default};
//       background-color: transparent;
//       &:hover {
//         background-color: ${`rgba(${themeVars.colors.palette.warning.defaultChannel}, 0.08)`};
//       }
//     }

//     /* Close Button */
//     [data-close-button] {
//       top: 0;
//       right: 0;
//       left: auto;
//       border-width: 1px;
//       border-style: dashed;
//       background-color: ${themeVars.colors.background.paper};
//       border-color: ${themeVars.colors.common.border};
//     }
//   }
// `;
