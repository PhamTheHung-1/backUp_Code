// for testing types utils
// Định nghĩa Helper ép TypeScript tính toán và làm phẳng mọi toán tử & deep
export type InferElementType<T> = T extends (infer E)[] ? E : never;

// biome-ignore lint/complexity/noBannedTypes : temp
export type DeepPrettify<T> = T extends Function
	? T
	: T extends Array<infer InferredArrayMember>
		? Array<DeepPrettify<InferredArrayMember>>
		: T extends object
			? { [Key in keyof T]: DeepPrettify<T[Key]> } & {}
			: T;

// Utility Type trích xuất chính xác kiểu dữ liệu 'data' khi gọi hàm thành công
// biome-ignore lint/suspicious/noExplicitAny: temp
export type InferTreatyData<T> = T extends (...args: any[]) => Promise<infer R>
	? R extends { data: infer D }
		? DeepPrettify<NonNullable<D>> // Loại bỏ null/undefined để lấy schema gốc thành công
		: never
	: never;

// biome-ignore lint/suspicious/noExplicitAny: temp
export type InferTreatyBody<T> = T extends (...args: infer Args) => any
	? Args[0] extends { body: infer B }
		? DeepPrettify<B>
		: never
	: never;

export type GetRequestBodyType<
    App extends { schema: Record<string, any> },
	Path extends keyof App["schema"],
	Method extends keyof App["schema"][Path],
> = DeepPrettify<App["schema"][Path][Method]["body"]>;

// Hàm an toàn để lấy schema từ mọi loại Instance Elysia
// biome-ignore lint/suspicious/noExplicitAny: temp
type ExtractSchema<T> = T extends { schema: infer S } ? S : any; // should return nerver

// export type InferRequestBody<
// 	TApp,
// 	Path extends keyof ExtractSchema<TApp>,
// 	Method extends keyof ExtractSchema<TApp>[Path],
// > = DeepPrettify<ExtractSchema<TApp>[Path][Method]["body"]>;

export type InferRequestBody<
        TApp,
        Path extends keyof ExtractSchema<TApp>,
        Method extends keyof ExtractSchema<TApp>[Path],
    > = ExtractSchema<TApp>[Path][Method] extends { body: infer B } 
        ? DeepPrettify<B> 
        : never; // Hoặc trả về Record<string, never> tùy bạn

export type InferQuery<
        TApp,
        Path extends keyof ExtractSchema<TApp>,
        Method extends keyof ExtractSchema<TApp>[Path],
    > = ExtractSchema<TApp>[Path][Method] extends { query: infer Q } 
        ? DeepPrettify<Q> 
        : never;

// export type InferRequestBody<
// 	TApp extends { schema: any },
// 	Path extends keyof TApp['schema'],
// 	Method extends keyof TApp['schema'][Path]
// > = DeepPrettify<TApp['schema'][Path][Method]['body']>;

//convert FlatArrayTree Type to Tree Type
// biome-ignore lint/suspicious/noExplicitAny: temp
export type TreeFromFlatArray<FlatArrayTree extends any[]> = FlatArrayTree extends (infer NodeType)[]
	? DeepPrettify<(NodeType & { children?: NodeType[] })[]>
	: never;

// biome-ignore lint/suspicious/noExplicitAny: temp
export type ExtractArrayElementType<T extends readonly any[]> = T extends readonly (infer U)[] ? U : never;

//recursive Extract Array Element Type
export type Flatten<T> = T extends Array<infer U> ? Flatten<U> : T;

// to get body type of Eden Treaty api body
// biome-ignore lint/suspicious/noExplicitAny: temp
export type InferReqBodyType<T extends (...args: any) => any> = DeepPrettify<Parameters<T>[0]>;
// biome-ignore lint/suspicious/noExplicitAny: temp
export type InferResType<T extends (...args: any) => any> = DeepPrettify<NonNullable<Awaited<ReturnType<T>>["data"]>>;
// 1. Lấy kiểu phản hồi đầy đủ (chứa cả { data, error, status })
// type FullResponse = Awaited<ReturnType<typeof treatyClient.auth.login.post>>;

// 2. Trích xuất riêng phần dữ liệu sạch (Data) khi API thành công
// export type LoginResponseData = NonNullable<FullResponse['data']>;

// 3. Trích xuất phần dữ liệu lỗi (Error) nếu bạn cần xử lý catch/display error
// export type LoginResponseError = NonNullable<FullResponse['error']>;

//test
// type NestedArray = number\[][\][];
// type Flat = Flatten<NestedArray>;  // This will be 'number'

// Extract Type from Tuples
// type TupleToUnion<T extends any[]> = T extends [infer U, ...infer Rest]
//   ? U | TupleToUnion<Rest>
//   : never;

// function getTupleHead<T extends any[]>(tuple: [...T]): TupleToUnion<T> {
//   return tuple[0];
// }

// const result1 = getTupleHead(["hello", 42]); // result1 is inferred as string | number
// const result2 = getTupleHead([true, false, true]); // result2 is inferred as boolean

// type UnwrapMaybeFunction<T> = T extends (...a: any) => infer R ? R : T;
// export type Response = UnwrapMaybeFunction<typeof treatyClient.api.menus.get>;
