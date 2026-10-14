import { ORG_LIST } from "@fe/_mock/assets";
import { delay, HttpResponse, http } from "msw";

const orgList = http.get("/api/org", async () => {
	await delay(1000);
	return HttpResponse.json({
		status: 0,
		message: "",
		data: ORG_LIST,
	});
});

export default [orgList];
