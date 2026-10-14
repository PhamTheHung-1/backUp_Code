import { memo } from "react";
import type { Props as ApexChartProps } from "react-apexcharts";
import ApexChart from "react-apexcharts";
import "./styles.css";

function Chart(props: ApexChartProps) {
	return (
		<div className="apexcharts-wrapper">
			<ApexChart {...props} />
		</div>
	);
}

export default memo(Chart);
