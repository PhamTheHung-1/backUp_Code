import { setupWorker } from "msw/browser";

import orgMockApi from "./handlers/_org";
import userMockApi from "./handlers/_user";

const handlers = [...userMockApi, ...orgMockApi];
const worker = setupWorker(...handlers);

export default worker;
