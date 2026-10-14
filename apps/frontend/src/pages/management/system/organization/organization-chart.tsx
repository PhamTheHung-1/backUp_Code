import type { Organization } from "@fe/async-store/org";
import { themeVars } from "@fe/theme/theme.css";
import type { ReactNode } from "react";
import { Tree, TreeNode } from "react-organizational-chart";

type Props = {
	organizations?: Organization[];
};
export default function OrganizationChart({ organizations = [] }: Props) {
	return (
		<Tree lineWidth="1px" lineColor={themeVars.colors.palette.primary.default} lineBorderRadius="24px" label={<StyledNode>Root</StyledNode>}>
			{organizations.map(org => (
				<OrganizationChartTreeNode key={org.id} organization={org} />
			))}
		</Tree>
	);
}

type OrganizationChartTreeNodeProps = {
	organization: Organization;
};
function OrganizationChartTreeNode({ organization: { name, children } }: OrganizationChartTreeNodeProps) {
	return (
		<TreeNode label={<StyledNode>{name}</StyledNode>}>
			{children?.map(org => (
				<OrganizationChartTreeNode key={org.id} organization={org} />
			))}
		</TreeNode>
	);
}

function StyledNode({ children }: { children: ReactNode }) {
	return (
		<div className="inline-flex relative z-0 overflow-hidden capitalize rounded-xl p-4 text-primary border transition-shadow duration-300 ease-in-out bg-[rgba(var(--colors-palette-primary-lightChannel),0.2)] border-[rgba(var(--colors-palette-primary-darkerChannel),0.24)]">
			{children}
		</div>
	);
}

// const StyledNode = styled.div`
//   transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
//   overflow: hidden;
//   position: relative;
//   z-index: 0;
//   padding: 16px;
//   border-radius: 12px;
//   display: inline-flex;
//   text-transform: capitalize;
//   color: ${themeVars.colors.palette.primary.default};
//   background-color: ${rgbAlpha(themeVars.colors.palette.primary.lightChannel, 0.2)};
//   border: 1px solid ${rgbAlpha(themeVars.colors.palette.primary.darkerChannel, 0.24)};
// `;
