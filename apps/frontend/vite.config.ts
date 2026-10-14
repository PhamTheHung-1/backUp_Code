import path from "node:path";

import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import tsconfigPaths from "vite-tsconfig-paths";

// ... existing imports ...

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const base = env.VITE_APP_BASE_PATH || "/";
	const isProduction = mode === "production";

	return {
		base,
		plugins: [
			react({
				// Add React plugins configuration
				babel: {
					parserOpts: {
						plugins: ["decorators-legacy", "classProperties"],
					},
				},
			}),
			tsconfigPaths(),
			createSvgIconsPlugin({
				iconDirs: [path.resolve(process.cwd(), "src/assets/icons")],
				symbolId: "icon-[dir]-[name]",
			}),
			isProduction &&
				visualizer({
					open: true,
					gzipSize: true,
					brotliSize: true,
					template: "treemap", // Using a tree diagram is more intuitive
				}),
		].filter(Boolean),

		server: {
			open: true,
			host: true,
			port: 3002,
			// proxy: {
			// 	"/api": {
			// 		target: "http://localhost:3002",
			// 		changeOrigin: true,
			// 		rewrite: path => path.replace(/^\/api/, ""),
			// 		secure: false,
			// 	},
			// },
		},

		build: {
			target: "esnext",
			minify: "esbuild",
			sourcemap: !isProduction,
			cssCodeSplit: true,
			chunkSizeWarningLimit: 1500,
			rollupOptions: {
				output: {
					// manualChunks(id) {
					// 	if (id.includes('node_modules')) {
					// 		// Kiểm tra nếu file thuộc về cụm react hoặc react-router
					// 		if (
					// 			id.includes('/react/') ||
					// 			id.includes('/react-dom/') ||
					// 			id.includes('/react-router/') ||
					// 			id.includes('/react-router-dom/') ||
					// 			id.includes('/scheduler/') // Thư viện core đi kèm của react-dom
					// 		) {
					// 			return 'vendor-core';
					// 		}

					// 		if (
					// 			id.includes('/antd/') ||
					// 			id.includes('/@ant-design/icons/') ||
					// 			id.includes('/@ant-design/cssinjs/') ||
					// 			id.includes('/framer-motion/') ||
					// 			id.includes('/styled-components/') // Thư viện core đi kèm của react-dom
					// 		) {
					// 			return 'vendor-ui';
					// 		}

					// 		if (
					// 			id.includes('/axios/') ||
					// 			id.includes('/dayjs/') ||
					// 			id.includes('/i18next/') ||
					// 			id.includes('/zustand/') ||
					// 			id.includes('/@iconify/react/')
					// 		) {
					// 			return 'vendor-utils';
					// 		}

					// 		if (
					// 			id.includes('/apexcharts/') ||
					// 			id.includes('/react-apexcharts/')
					// 		) {
					// 			return 'vendor-charts';
					// 		}
					// 	}
					// },
					manualChunks: {
						"vendor-core": ["react", "react-dom", "react-router", "antd", "@ant-design/icons", "@ant-design/cssinjs"],
						"vendor-ui": ["framer-motion", "styled-components"],
						"vendor-utils": ["axios", "dayjs", "i18next", "zustand", "@iconify/react"],
						"vendor-charts": ["apexcharts", "react-apexcharts"],
					},
				},
			},
		},

		// Optimize dependency pre-build
		optimizeDeps: {
			include: ["react", "react-dom", "react-router", "antd", "@ant-design/icons", "axios", "dayjs"],
			exclude: ["@iconify/react"], // Excluding dependencies that do not need to be prebuilt
		},

		// esbuild configuration
		esbuild: {
			drop: isProduction ? ["console", "debugger"] : [],
			legalComments: "none",
			target: "esnext",
		},
	};
});
